export type KycStatus = 'pending' | 'submitted' | 'approved' | 'rejected'
export type VerificationBadge = 'none' | 'basic' | 'verified' | 'premium'

export interface SellerUser {
  id: string
  businessName: string
  businessType?: string | null
  tradeLicenseNumber?: string | null
  businessCategory?: string | null
  yearsInBusiness?: number | null
  fullName?: string | null
  email: string
  phone: string | null
  address?: string | null
  city?: string | null
  postalCode?: string | null
  bankName?: string | null
  accountHolderName?: string | null
  accountNumber?: string | null
  branchName?: string | null
  routingNumber?: string | null
  kycStatus: KycStatus
  kycSubmittedAt: string | null
  kycRejectionReason: string | null
  verificationBadge: VerificationBadge
}

export interface SellerAuthState {
  seller: SellerUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface SellerRegisterData {
  businessName: string
  businessType: string
  tradeLicenseNumber: string
  businessCategory: string
  yearsInBusiness?: string
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  bankName: string
  accountHolderName: string
  accountNumber: string
  branchName: string
  routingNumber?: string
}

export interface SellerLoginData {
  identifier: string
  password: string
}
