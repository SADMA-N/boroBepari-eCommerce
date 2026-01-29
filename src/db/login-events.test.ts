import { describe, it, expect, vi } from 'vitest'
import { createLoginEvent, getLoginEventsByUserId } from './login-events'
import { db } from './index'

vi.mock('./index', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1, userId: 'user-1' }]),
      }),
    }),
    query: {
      loginEvents: {
        findMany: vi.fn().mockResolvedValue([{ id: 1, userId: 'user-1' }]),
      },
    },
  },
}))

describe('login-events data access layer', () => {
  it('should create a login event', async () => {
    const event = await createLoginEvent({
      userId: 'user-1',
      ipAddress: '127.0.0.1',
      userAgent: 'test-agent',
    })
    expect(event).toEqual([{ id: 1, userId: 'user-1' }])
    expect(db.insert).toHaveBeenCalled()
  })

  it('should get login events by user id', async () => {
    const events = await getLoginEventsByUserId('user-1')
    expect(events).toEqual([{ id: 1, userId: 'user-1' }])
    expect(db.query.loginEvents.findMany).toHaveBeenCalled()
  })
})
