import React, { createContext, useContext, useEffect, useState } from 'react'

export type PaymentMethod = 'full' | 'deposit' | 'cod'

export type PaymentChannel = 'mfs' | 'bank'

export interface PaymentDetails {
  channel: PaymentChannel | null
  provider: string
  transactionId: string
  referenceNumber: string
  senderAccount: string
  declarationAccepted: boolean
}

export interface CheckoutState {
  shippingAddressId: number | null
  paymentMethod: PaymentMethod | null
  paymentDetails: PaymentDetails
  poNumber: string
  notes: string
  isPaymentVerified: boolean // For COD check
}

interface CheckoutContextType {
  state: CheckoutState
  setShippingAddressId: (id: number) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setPaymentDetails: (details: PaymentDetails) => void
  setPoNumber: (po: string) => void
  setNotes: (notes: string) => void
  setIsPaymentVerified: (verified: boolean) => void
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined,
)

const STORAGE_KEY = 'borobepari_checkout_state'

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CheckoutState>({
    shippingAddressId: null,
    paymentMethod: null,
    paymentDetails: {
      channel: null,
      provider: '',
      transactionId: '',
      referenceNumber: '',
      senderAccount: '',
      declarationAccepted: false,
    },
    poNumber: '',
    notes: '',
    isPaymentVerified: false,
  })

  // Load from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<CheckoutState>
        setState((prev) => ({
          ...prev,
          ...parsed,
          paymentDetails: {
            ...prev.paymentDetails,
            ...(parsed.paymentDetails || {}),
          },
        }))
      } catch (e) {
        console.error('Failed to parse checkout state', e)
      }
    }
  }, [])

  // Save to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setShippingAddressId = (id: number) =>
    setState((prev) => ({ ...prev, shippingAddressId: id }))
  const setPaymentMethod = (method: PaymentMethod) =>
    setState((prev) => ({ ...prev, paymentMethod: method }))
  const setPaymentDetails = (details: PaymentDetails) =>
    setState((prev) => ({ ...prev, paymentDetails: details }))
  const setPoNumber = (po: string) =>
    setState((prev) => ({ ...prev, poNumber: po }))
  const setNotes = (notes: string) =>
    setState((prev) => ({ ...prev, notes: notes }))
  const setIsPaymentVerified = (verified: boolean) =>
    setState((prev) => ({ ...prev, isPaymentVerified: verified }))

  return (
    <CheckoutContext.Provider
      value={{
        state,
        setShippingAddressId,
        setPaymentMethod,
        setPaymentDetails,
        setPoNumber,
        setNotes,
        setIsPaymentVerified,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  )
}

export function useCheckout() {
  const context = useContext(CheckoutContext)
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider')
  }
  return context
}
