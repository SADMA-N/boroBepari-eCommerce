import { and, eq } from 'drizzle-orm'
import { createServerFn } from '@tanstack/react-start'
import type {Address, NewAddress} from '@/db/schema';
import { db } from '@/db'
import {   addresses } from '@/db/schema'

export const getAddresses = createServerFn({ method: 'GET' })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    return await db.select().from(addresses).where(eq(addresses.userId, userId))
  })

export const addAddress = createServerFn({ method: 'POST' })
  .inputValidator((data: NewAddress) => data)
  .handler(async ({ data }) => {
    // If setting as default, unset other defaults for this user
    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, data.userId))
    }

    return await db.insert(addresses).values(data).returning()
  })

export const updateAddress = createServerFn({ method: 'POST' })
  .inputValidator((data: { id: number; address: Partial<NewAddress> }) => data)
  .handler(async ({ data }) => {
    const { id, address } = data

    // If setting as default, unset other defaults for this user
    if (address.isDefault && address.userId) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, address.userId))
    }

    return await db
      .update(addresses)
      .set(address)
      .where(eq(addresses.id, id))
      .returning()
  })

export const deleteAddress = createServerFn({ method: 'POST' })
  .inputValidator((id: number) => id)
  .handler(async ({ data: id }) => {
    return await db.delete(addresses).where(eq(addresses.id, id)).returning()
  })
