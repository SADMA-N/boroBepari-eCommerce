export type KycStatus = 'pending' | 'submitted' | 'approved' | 'rejected'
export type VerificationBadge = 'none' | 'basic' | 'verified' | 'premium'

export interface SellerUser {
  id: string
  businessName: string
  email: string
  phone: string | null
  kycStatus: KycStatus
  verificationBadge: VerificationBadge
}

export interface SellerAuthState {
  seller: SellerUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface SellerRegisterData {
  businessName: string
  email: string
  password: string
  phone?: string
}

export interface SellerLoginData {
  identifier: string
  password: string
}
