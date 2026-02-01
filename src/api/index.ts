import { Hono } from 'hono'
import { Scalar } from '@scalar/hono-api-reference'
import { describeRoute, openAPIRouteHandler, resolver, validator } from 'hono-openapi'
import { z } from 'zod'
import { CreateTodoSchema, TodoSchema } from './schemas/todo'

// In-memory storage
const todos = [
  { id: 1, name: 'Get groceries' },
  { id: 2, name: 'Buy a new phone' },
  { id: 3, name: 'Finish the project' },
]

const app = new Hono().basePath('/api')

// GET /api/todos - List all todos
app.get(
  '/todos',
  describeRoute({
    tags: ['Todos'],
    summary: 'List all todos',
    description: 'Returns an array of all todo items',
    responses: {
      200: {
        description: 'Successful response with array of todos',
        content: {
          'application/json': {
            schema: resolver(z.array(TodoSchema)),
          },
        },
      },
    },
  }),
  (c) => {
    return c.json(todos)
  }
)

// POST /api/todos - Create a new todo
app.post(
  '/todos',
  describeRoute({
    tags: ['Todos'],
    summary: 'Create a new todo',
    description: 'Creates a new todo item and returns it',
    responses: {
      201: {
        description: 'Todo created successfully',
        content: {
          'application/json': {
            schema: resolver(TodoSchema),
          },
        },
      },
    },
  }),
  validator('json', CreateTodoSchema),
  (c) => {
    const input = c.req.valid('json')
    const newTodo = { id: todos.length + 1, name: input.name }
    todos.push(newTodo)
    return c.json(newTodo, 201)
  }
)

// OpenAPI spec endpoint - MUST be after all routes
app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Borobepari E-commerce API',
        version: '1.0.0',
        description: 'API documentation for the Borobepari e-commerce platform',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local Development' },
      ],
      tags: [{ name: 'Todos', description: 'Todo management endpoints' }],
    },
  })
)

// Scalar documentation UI
app.get(
  '/docs',
  Scalar({
    url: '/api/openapi',
    theme: 'purple',
    pageTitle: 'Borobepari API Documentation',
  })
)

export default app
