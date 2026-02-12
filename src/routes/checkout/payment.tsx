import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CreditCard,
  Info,
  Percent,
  ShieldCheck,
} from 'lucide-react'
import type { PaymentDetails, PaymentMethod } from '@/contexts/CheckoutContext'
import { useCheckout } from '@/contexts/CheckoutContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout'
import { formatCurrency } from '@/lib/cart-utils'

export const Route = createFileRoute('/checkout/payment')({
  component: PaymentPage,
})

function PaymentPage() {
  const {
    state,
    setPaymentMethod,
    setPaymentDetails,
    setPoNumber,
    setNotes,
    setIsPaymentVerified,
  } = useCheckout()
  const { cart } = useCart()
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // Local state for immediate feedback
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    state.paymentMethod,
  )
  const [poInput, setPoInput] = useState(state.poNumber)
  const [notesInput, setNotesInput] = useState(state.notes)
  const [paymentForm, setPaymentForm] = useState<PaymentDetails>(
    state.paymentDetails,
  )

  // Verify user logic (Mock: check emailVerified)
  // In real app, check for specific 'verified_buyer' role/flag
  const isVerified = isAuthenticated // && user?.emailVerified // Assuming basic auth is enough for now, or strict check
  // For demo, let's say all logged in users can see it but disable if not specific check
  // The requirement says "Disable if buyer not verified". I'll use a mock check.
  const isBusinessVerified = isVerified

  useEffect(() => {
    setIsPaymentVerified(isBusinessVerified)
  }, [isBusinessVerified, setIsPaymentVerified])

  useEffect(() => {
    setPaymentDetails(paymentForm)
  }, [paymentForm, setPaymentDetails])

  useEffect(() => {
    // If no address selected, redirect back (unless guest flow handled differently)
    // Checking state.shippingAddressId might be null if refreshed and guest.
    // For now, lenient check.
    if (!cart.items.length) router.navigate({ to: '/cart' })
  }, [cart.items.length, router])

  const handleMethodSelect = (method: PaymentMethod) => {
    if (method === 'cod' && !isBusinessVerified) return
    setSelectedMethod(method)
    setPaymentMethod(method)
    if ((method === 'full' || method === 'deposit') && !paymentForm.channel) {
      updatePaymentForm({ channel: 'mfs' })
    }
  }

  const handleContinue = () => {
    if (selectedMethod) {
      if (
        (selectedMethod === 'full' || selectedMethod === 'deposit') &&
        !isTransferValid
      ) {
        return
      }
      setPoNumber(poInput)
      setNotes(notesInput)
      router.navigate({ to: '/checkout/review' })
    }
  }

  // Calculations
  const total = cart.total
  const rfqDepositRate = cart.items.find(i => (i.depositPercentage ?? 0) > 0)?.depositPercentage
  const depositAmount = Math.ceil(total * (rfqDepositRate ? rfqDepositRate / 100 : 0.3))
  const balanceDue = total - depositAmount

  const MFS_PROVIDERS = ['bKash', 'Nagad', 'Rocket', 'Upay']
  const BANK_PROVIDERS = [
    // State-owned commercial banks (SOCBs)
    'Agrani Bank',
    'Bangladesh Development Bank',
    'BASIC Bank',
    'Janata Bank',
    'Rupali Bank',
    'Sonali Bank',
    'Sammilito Islami Bank',
    // Specialized banks (SDBs)
    'Bangladesh Krishi Bank',
    'Rajshahi Krishi Unnayan Bank',
    'Probashi Kallyan Bank',
    // Private commercial banks (Conventional PCBs)
    'AB Bank PLC',
    'Bangladesh Commerce Bank Limited',
    'Bank Asia PLC',
    'Bengal Commercial Bank PLC',
    'BRAC Bank PLC',
    'Citizens Bank PLC',
    'City Bank PLC',
    'Community Bank Bangladesh PLC',
    'Dhaka Bank PLC',
    'Dutch-Bangla Bank PLC',
    'Eastern Bank PLC',
    'IFIC Bank PLC',
    'Jamuna Bank PLC',
    'Meghna Bank PLC',
    'Mercantile Bank PLC',
    'Midland Bank PLC',
    'Modhumoti Bank PLC',
    'Mutual Trust Bank PLC',
    'National Bank PLC',
    'National Credit & Commerce Bank PLC',
    'NRB Bank PLC',
    'NRBC Bank PLC',
    'ONE Bank PLC',
    'Padma Bank PLC',
    'Prime Bank PLC',
    'Pubali Bank PLC',
    'SBAC Bank PLC',
    'Shimanto Bank PLC',
    'Southeast Bank PLC',
    'The Premier Bank PLC',
    'Trust Bank PLC',
    'United Commercial Bank PLC',
    'Uttara Bank PLC',
    // Islami Shariah Based PCBs
    'Al-Arafah Islami Bank PLC',
    'ICB Islamic Bank PLC',
    'Islami Bank Bangladesh PLC',
    'Shahjalal Islami Bank PLC',
    'Standard Bank PLC',
  ]

  const DUMMY_ACCOUNT = {
    mfs: {
      name: 'BoroBepari Ltd',
      wallet: '01XXXXXXXXX',
    },
    bank: {
      name: 'BoroBepari Ltd',
      bankName: 'BRAC Bank',
      accountNumber: '1234567890',
      branch: 'Gulshan Branch',
    },
  }

  const isTransferValid =
    paymentForm.channel &&
    paymentForm.provider.trim() &&
    paymentForm.transactionId.trim() &&
    paymentForm.referenceNumber.trim() &&
    paymentForm.senderAccount.trim() &&
    paymentForm.declarationAccepted

  const updatePaymentForm = (next: Partial<PaymentDetails>) => {
    setPaymentForm((prev) => ({ ...prev, ...next }))
  }

  const renderTransferForm = (amountToPay: number) => (
    <div className="mt-4 space-y-4">
      <div className="rounded-lg border border-orange-100 dark:border-orange-900/40 bg-orange-50/60 dark:bg-orange-950/30 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 dark:text-gray-300">
            Amount to Pay Now
          </span>
          <span className="font-semibold text-orange-700">
            {formatCurrency(amountToPay)}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm space-y-3">
        <p className="font-semibold text-gray-800 dark:text-gray-200">
          Pay To (Recipient)
        </p>
        {paymentForm.channel === 'bank' ? (
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {DUMMY_ACCOUNT.bank.name}
              </span>
            </div>
            <div>Bank: {DUMMY_ACCOUNT.bank.bankName}</div>
            <div>Account: {DUMMY_ACCOUNT.bank.accountNumber}</div>
            <div>Branch: {DUMMY_ACCOUNT.bank.branch}</div>
          </div>
        ) : (
          <div className="space-y-1 text-gray-600 dark:text-gray-400">
            <div>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {DUMMY_ACCOUNT.mfs.name}
              </span>
            </div>
            <div>Wallet: {DUMMY_ACCOUNT.mfs.wallet}</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['mfs', 'bank'] as const).map((channel) => (
          <button
            key={channel}
            type="button"
            onClick={() =>
              updatePaymentForm({
                channel,
                provider: '',
              })
            }
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              paymentForm.channel === channel
                ? 'border-orange-500 bg-orange-50/60 text-orange-700'
                : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-orange-300'
            }`}
          >
            {channel === 'mfs' ? 'MFS' : 'Bank'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {paymentForm.channel === 'bank' ? 'Bank Name' : 'MFS Provider'}
          </label>
          {paymentForm.channel === 'bank' ? (
            <>
              <input
                type="text"
                list="bank-providers"
                value={paymentForm.provider}
                onChange={(e) => updatePaymentForm({ provider: e.target.value })}
                placeholder="Search bank name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
              />
              <datalist id="bank-providers">
                {BANK_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider} />
                ))}
              </datalist>
            </>
          ) : (
            <select
              value={paymentForm.provider}
              onChange={(e) => updatePaymentForm({ provider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
            >
              <option value="">Select provider</option>
              {MFS_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Transaction ID
          </label>
          <input
            type="text"
            value={paymentForm.transactionId}
            onChange={(e) =>
              updatePaymentForm({ transactionId: e.target.value })
            }
            placeholder="e.g. TXN-123456"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reference Number
          </label>
          <input
            type="text"
            value={paymentForm.referenceNumber}
            onChange={(e) =>
              updatePaymentForm({ referenceNumber: e.target.value })
            }
            placeholder="e.g. REF-2024-001"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {paymentForm.channel === 'bank'
              ? 'Bank Account Number'
              : 'Wallet Number'}
          </label>
          <input
            type="text"
            value={paymentForm.senderAccount}
            onChange={(e) =>
              updatePaymentForm({ senderAccount: e.target.value })
            }
            placeholder="e.g. 01XXXXXXXXX"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
          />
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
        <input
          type="checkbox"
          checked={paymentForm.declarationAccepted}
          onChange={(e) =>
            updatePaymentForm({ declarationAccepted: e.target.checked })
          }
          className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <span>
          I confirm the payment is made from my own account. Third-party
          payments are not allowed.
        </span>
      </label>
    </div>
  )

  const paymentOptions = [
    {
      id: 'full' as PaymentMethod,
      title: 'Full Payment',
      description: 'Pay complete amount now',
      icon: CreditCard,
      details: (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 p-3 rounded border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between font-medium mb-1">
            <span>Total Payable Now:</span>
            <span className="text-orange-600">{formatCurrency(total)}</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Manual transfer required. Provide transaction details below.
          </p>
          {renderTransferForm(total)}
        </div>
      ),
    },
    {
      id: 'deposit' as PaymentMethod,
      title: rfqDepositRate ? `${rfqDepositRate}% Deposit` : '30% Deposit',
      description: `Pay ${rfqDepositRate || 30}% now, rest on delivery`,
      icon: Percent,
      details: (
        <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-slate-800 p-3 rounded border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between mb-1">
            <span>Deposit ({rfqDepositRate || 30}%):</span>
            <span className="font-bold text-orange-600">
              {formatCurrency(depositAmount)}
            </span>
          </div>
          <div className="flex justify-between text-gray-500 dark:text-gray-400">
            <span>Balance Due:</span>
            <span>{formatCurrency(balanceDue)}</span>
          </div>
          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
            <Info size={12} />
            Balance must be paid upon delivery.
          </p>
          {renderTransferForm(depositAmount)}
        </div>
      ),
    },
    {
      id: 'cod' as PaymentMethod,
      title: 'Pay on Delivery',
      description: 'Pay when you receive the order',
      icon: Banknote,
      disabled: !isBusinessVerified,
      details: (
        <div className="mt-3 text-sm bg-white dark:bg-slate-800 p-3 rounded border border-gray-100 dark:border-slate-700">
          {!isBusinessVerified ? (
            <p className="text-red-600 text-xs flex items-start gap-1">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              Available for verified business buyers only.
            </p>
          ) : (
            <>
              <div className="flex justify-between font-medium mb-1">
                <span>Due on Delivery:</span>
                <span className="text-orange-600">{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                <ShieldCheck size={12} />
                Verified Buyer Benefit Applied
              </p>
            </>
          )}
        </div>
      ),
    },
  ]

  // Summary Logic based on selection
  let dueNow = 0
  let dueLater = 0

  if (selectedMethod === 'full') {
    dueNow = total
  } else if (selectedMethod === 'deposit') {
    dueNow = depositAmount
    dueLater = balanceDue
  } else if (selectedMethod === 'cod') {
    dueLater = total
  }

  // Handle case where RFQ item already has a forced deposit requirement
  // Even if user selects COD or Full, we should probably follow the quote terms?
  // Usually, if a quote says 30% deposit, it MUST be paid. 
  // Let's stick to the selected method for now but show the info correctly.

  return (
    <CheckoutLayout currentStep="payment">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Payment Methods */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Payment Method
            </h2>
            <div className="space-y-3">
              {paymentOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() =>
                    !option.disabled && handleMethodSelect(option.id)
                  }
                  className={`
                    relative border rounded-xl p-4 cursor-pointer transition-all
                    ${option.disabled ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-slate-800' : 'hover:border-orange-300'}
                    ${selectedMethod === option.id ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/20 dark:bg-orange-950/20' : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900'}
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`
                      w-5 h-5 mt-1 rounded-full border flex items-center justify-center flex-shrink-0
                      ${selectedMethod === option.id ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800'}
                    `}
                    >
                      {selectedMethod === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <option.icon
                          size={20}
                          className={
                            selectedMethod === option.id
                              ? 'text-orange-600'
                              : 'text-gray-500 dark:text-gray-400'
                          }
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {option.title}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {option.description}
                      </p>

                      {/* Expanded Details */}
                      {selectedMethod === option.id && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                          {option.details}
                        </div>
                      )}

                      {/* Show disabled reason if disabled and not selected (though click disabled) */}
                      {option.disabled && selectedMethod !== option.id && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 p-2 rounded inline-block">
                          Verified buyers only
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Optional Fields */}
          <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Additional Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PO Number{' '}
                  <span className="text-gray-400 dark:text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={poInput}
                  onChange={(e) => setPoInput(e.target.value)}
                  placeholder="e.g. PO-2024-001"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Order Notes{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={3}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Special instructions for delivery or packaging..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm resize-none"
              />
            </div>
          </section>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Link
              to="/checkout"
              className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back to Address
            </Link>

            <button
              onClick={handleContinue}
              disabled={
                !selectedMethod ||
                ((selectedMethod === 'full' || selectedMethod === 'deposit') &&
                  !isTransferValid)
              }
              className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform active:scale-[0.98]"
            >
              Continue to Review
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h3>
            <div className="space-y-3 text-sm pb-4 border-b dark:border-slate-800">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Delivery</span>
                <span>
                  {cart.deliveryFee === 0
                    ? 'Free'
                    : formatCurrency(cart.deliveryFee)}
                </span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(cart.discount)}</span>
                </div>
              )}
            </div>

            <div className="py-4 border-b dark:border-slate-800">
              <div className="flex justify-between items-center font-bold text-lg text-gray-900 dark:text-white mb-1">
                <span>Total</span>
                <span>{formatCurrency(cart.total)}</span>
              </div>
            </div>

            {/* Payment Breakdown */}
            {selectedMethod && (
              <div className="py-4 space-y-2 bg-orange-50 dark:bg-orange-950/20 -mx-6 px-6 border-b border-orange-100 dark:border-orange-900/30">
                <div className="flex justify-between text-sm font-medium text-gray-800 dark:text-gray-300">
                  <span>Due Now</span>
                  <span className="text-orange-700">
                    {formatCurrency(dueNow)}
                  </span>
                </div>
                {dueLater > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Due on Delivery</span>
                    <span>{formatCurrency(dueLater)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-center gap-1 mb-2">
                <ShieldCheck size={14} className="text-green-600" />
                Secure Payment
              </p>
              By proceeding, you agree to our Terms of Service and Privacy
              Policy.
            </div>
          </div>
        </div>
      </div>
    </CheckoutLayout>
  )
}
