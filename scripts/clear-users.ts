import { count } from 'drizzle-orm'
import { db } from '../src/db'
import * as schema from '../src/db/schema'

async function main() {
  console.log('Cleaning up all user-related data...')

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting quotes...')
    await db.delete(schema.quotes)

    console.log('Deleting RFQs...')
    await db.delete(schema.rfqs)

    console.log('Deleting stock alerts...')
    await db.delete(schema.stockAlerts)

    console.log('Deleting order items...')
    await db.delete(schema.orderItems)

    console.log('Deleting orders...')
    await db.delete(schema.orders)

    console.log('Deleting addresses...')
    await db.delete(schema.addresses)

    console.log('Deleting login events...')
    await db.delete(schema.loginEvents)

    console.log('Deleting password reset OTPs...')
    await db.delete(schema.passwordResetOtps)

    console.log('Deleting verifications...')
    await db.delete(schema.verification)

    console.log('Deleting sessions...')
    await db.delete(schema.session)

    console.log('Deleting accounts...')
    await db.delete(schema.account)

    console.log('Deleting sellers...')
    await db.delete(schema.sellers)

    console.log('Deleting users...')
    await db.delete(schema.user)

    // Verify
    const userCount = await db.select({ count: count() }).from(schema.user)
    const sellerCount = await db.select({ count: count() }).from(schema.sellers)
    const otpCount = await db
      .select({ count: count() })
      .from(schema.passwordResetOtps)
    const verCount = await db
      .select({ count: count() })
      .from(schema.verification)

    console.log('--- Verification ---')
    console.log(`Users remaining: ${userCount[0].count}`)
    console.log(`Sellers remaining: ${sellerCount[0].count}`)
    console.log(`OTPs remaining: ${otpCount[0].count}`)
    console.log(`Verifications remaining: ${verCount[0].count}`)

    console.log('Successfully cleared all users and related data.')
  } catch (error) {
    console.error('Failed to clear users:', error)
  } finally {
    process.exit(0)
  }
}

main()
