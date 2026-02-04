import { describe, expect, it } from 'vitest'
import { getAdminPermissions } from './admin'

describe('getAdminPermissions', () => {
  it('grants full access to super admin', () => {
    const perms = getAdminPermissions('super_admin')
    expect(perms['settings.edit']).toBe(true)
    expect(perms['users.delete']).toBe(true)
    expect(perms['logs.view']).toBe(true)
  })

  it('blocks settings edits for admin role', () => {
    const perms = getAdminPermissions('admin')
    expect(perms['settings.view']).toBe(true)
    expect(perms['settings.edit']).toBe(false)
  })

  it('limits moderator to kyc and products', () => {
    const perms = getAdminPermissions('moderator')
    expect(perms['kyc.review']).toBe(true)
    expect(perms['products.moderate']).toBe(true)
    expect(perms['users.view']).toBe(false)
    expect(perms['disputes.view']).toBe(false)
  })
})
