import { db } from './index'
import { loginEvents, NewLoginEvent } from './schema'

export async function createLoginEvent(data: NewLoginEvent) {
  return await db.insert(loginEvents).values(data).returning()
}

export async function getLoginEventsByUserId(userId: string) {
  return await db.query.loginEvents.findMany({
    where: (events, { eq }) => eq(events.userId, userId),
    orderBy: (events, { desc }) => [desc(events.createdAt)],
  })
}
