/**
 * Coupon Validation Hook
 *
 * Handles async coupon validation via API with loading states,
 * error handling, and integration with the cart context.
 */

import { useCallback, useState } from 'react'
import type { CouponCode, ValidateCouponResponse } from '@/types/cart'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'

interface CouponValidationState {
  /** Whether a validation request is in progress */
  isValidating: boolean
  /** Error message from validation */
  error: string | null
  /** Success message after applying coupon */
  successMessage: string | null
  /** The validated and applied coupon */
  appliedCoupon: CouponCode | null
  /** Description of the applied coupon */
  couponDescription: string | null
  /** Calculated discount amount */
  calculatedDiscount: number
}

interface UseCouponValidationReturn extends CouponValidationState {
  /** Validate and apply a coupon code */
  validateAndApply: (code: string) => Promise<boolean>
  /** Remove the currently applied coupon */
  removeCoupon: () => void
  /** Clear any error messages */
  clearError: () => void
  /** Clear success message */
  clearSuccess: () => void
}

export function useCouponValidation(): UseCouponValidationReturn {
  const { cart, applyCoupon, removeCoupon: removeCartCoupon } = useCart()
  const { user } = useAuth()

  const [state, setState] = useState<CouponValidationState>({
    isValidating: false,
    error: null,
    successMessage: null,
    appliedCoupon: cart.appliedCoupon || null,
    couponDescription: null,
    calculatedDiscount: cart.discount,
  })

  const validateAndApply = useCallback(
    async (code: string): Promise<boolean> => {
      const trimmedCode = code.trim().toUpperCase()

      if (!trimmedCode) {
        setState((prev) => ({
          ...prev,
          error: 'Please enter a coupon code',
          successMessage: null,
        }))
        return false
      }

      // Check if same coupon is already applied
      if (cart.appliedCoupon?.code === trimmedCode) {
        setState((prev) => ({
          ...prev,
          error: 'This coupon is already applied',
          successMessage: null,
        }))
        return false
      }

      setState((prev) => ({
        ...prev,
        isValidating: true,
        error: null,
        successMessage: null,
      }))

      try {
        const response = await fetch('/api/cart/validate-coupon', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: trimmedCode,
            cartSubtotal: cart.subtotal,
            userId: user?.id,
          }),
        })

        const data: ValidateCouponResponse & { description?: string } =
          await response.json()

        if (!data.isValid || !data.coupon) {
          setState((prev) => ({
            ...prev,
            isValidating: false,
            error: data.error || 'Invalid coupon code',
            successMessage: null,
          }))
          return false
        }

        // Apply the coupon to the cart
        const applyResult = applyCoupon(data.coupon)

        if (!applyResult.success) {
          setState((prev) => ({
            ...prev,
            isValidating: false,
            error: applyResult.error || 'Failed to apply coupon',
            successMessage: null,
          }))
          return false
        }

        // Success!
        const discountText =
          data.coupon.discountType === 'percentage'
            ? `${data.coupon.value}% off`
            : `৳${data.coupon.value} off`

        setState({
          isValidating: false,
          error: null,
          successMessage: `Coupon applied! You save ৳${data.calculatedDiscount?.toLocaleString() || 0}`,
          appliedCoupon: data.coupon,
          couponDescription: data.description || discountText,
          calculatedDiscount: data.calculatedDiscount || 0,
        })

        return true
      } catch (error) {
        console.error('Coupon validation error:', error)
        setState((prev) => ({
          ...prev,
          isValidating: false,
          error: 'Network error. Please try again.',
          successMessage: null,
        }))
        return false
      }
    },
    [cart.subtotal, cart.appliedCoupon, applyCoupon, user?.id]
  )

  const removeCoupon = useCallback(() => {
    removeCartCoupon()
    setState({
      isValidating: false,
      error: null,
      successMessage: null,
      appliedCoupon: null,
      couponDescription: null,
      calculatedDiscount: 0,
    })
  }, [removeCartCoupon])

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const clearSuccess = useCallback(() => {
    setState((prev) => ({ ...prev, successMessage: null }))
  }, [])

  return {
    ...state,
    // Sync with cart state
    appliedCoupon: cart.appliedCoupon || state.appliedCoupon,
    calculatedDiscount: cart.discount || state.calculatedDiscount,
    validateAndApply,
    removeCoupon,
    clearError,
    clearSuccess,
  }
}
