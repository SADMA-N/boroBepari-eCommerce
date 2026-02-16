import { Hono } from 'hono'
import { openAPIRouteHandler } from 'hono-openapi'
import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db'
import { z } from 'zod'

const app = new Hono().basePath('/demo')

const names = ['Alice', 'Bob', 'Charlie']

const todos = [
  { id: 1, name: 'Buy groceries' },
  { id: 2, name: 'Buy mobile phone' },
  { id: 3, name: 'Buy laptop' },
]

const IncomingMessageSchema = z.object({
  user: z.string(),
  text: z.string(),
})

const MessageSchema = IncomingMessageSchema.extend({
  id: z.number(),
})

export type DemoMessage = z.infer<typeof MessageSchema>

const serverMessagesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (message) => message.id,
    schema: MessageSchema,
  }),
)

let id = 0
serverMessagesCollection.insert({
  id: id++,
  user: 'Alice',
  text: 'Hello, how are you?',
})
serverMessagesCollection.insert({
  id: id++,
  user: 'Bob',
  text: "I'm fine, thank you!",
})

app.get('/api/names', (c) => c.json(names))

app.get('/api/tq-todos', (c) => c.json(todos))
app.post('/api/tq-todos', async (c) => {
  const name = await c.req.json()
  const todo = {
    id: todos.length + 1,
    name,
  }
  todos.push(todo)
  return c.json(todo)
})

app.get('/db-chat-api', () => {
  const stream = new ReadableStream({
    start(controller) {
      for (const [_id, message] of serverMessagesCollection.state) {
        controller.enqueue(JSON.stringify(message) + '\n')
      }
      serverMessagesCollection.subscribeChanges((changes) => {
        for (const change of changes) {
          if (change.type === 'insert') {
            controller.enqueue(JSON.stringify(change.value) + '\n')
          }
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
    },
  })
})

app.post('/db-chat-api', async (c) => {
  const message = IncomingMessageSchema.safeParse(await c.req.json())
  if (!message.success) {
    return new Response(message.error.message, { status: 400 })
  }

  serverMessagesCollection.insert({
    id: id++,
    user: message.data.user,
    text: message.data.text,
  })

  return c.json(message.data)
})

app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Borobepari Demo API',
        version: '1.0.0',
      },
    },
  }),
)

export default app
