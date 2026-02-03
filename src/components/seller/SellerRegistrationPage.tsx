import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  BadgeCheck,
  CreditCard,
  Headset,
  LineChart,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { useSellerAuth } from '@/contexts/SellerAuthContext'

type Step = 1 | 2 | 3

const BUSINESS_TYPES = ['Manufacturer', 'Wholesaler', 'Distributor', 'Retailer']
const BUSINESS_CATEGORIES = [
  'Apparel & Fashion',
  'Electronics',
  'Home & Kitchen',
  'Industrial Supplies',
  'Health & Beauty',
  'Grocery & FMCG',
  'Construction Materials',
]
const BANKS = [
  'BRAC Bank',
  'Dutch-Bangla Bank',
  'Eastern Bank',
  'Islami Bank',
  'Prime Bank',
  'Sonali Bank',
  'Standard Chartered',
]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BD_MOBILE_REGEX = /^01\d{9}$/
const TRADE_LICENSE_REGEX = /^[A-Za-z0-9-]{6,}$/
const BANK_ACCOUNT_REGEX = /^\d{10,}$/

export function SellerRegistrationPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useSellerAuth()
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [otpSent, setOtpSent] = useState(false)
  const [otpValue, setOtpValue] = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)

  const [form, setForm] = useState({
    businessName: '',
    businessType: '',
    tradeLicenseNumber: '',
    businessCategory: '',
    yearsInBusiness: '',
    fullName: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    postalCode: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    branchName: '',
    routingNumber: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/seller/dashboard' })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (otpCooldown <= 0) return
    const timer = window.setInterval(() => {
      setOtpCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [otpCooldown])

  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => {
      navigate({ to: '/seller/kyc' })
    }, 3000)
    return () => window.clearTimeout(timer)
  }, [success, navigate])

  const progress = useMemo(() => {
    if (step === 1) return 33
    if (step === 2) return 66
    return 100
  }, [step])

  const updateField = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const validateStep1 = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.businessName.trim()) nextErrors.businessName = 'Business name is required'
    if (!form.businessType) nextErrors.businessType = 'Select a business type'
    if (!form.tradeLicenseNumber.trim()) {
      nextErrors.tradeLicenseNumber = 'Trade license number is required'
    } else if (!TRADE_LICENSE_REGEX.test(form.tradeLicenseNumber.trim())) {
      nextErrors.tradeLicenseNumber = 'Use at least 6 characters (letters, numbers, dashes)'
    }
    if (!form.businessCategory) nextErrors.businessCategory = 'Select a business category'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateStep2 = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required'
    if (!form.email.trim()) {
      nextErrors.email = 'Email is required'
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address'
    }
    if (!form.mobile.trim()) {
      nextErrors.mobile = 'Mobile number is required'
    } else if (!BD_MOBILE_REGEX.test(form.mobile.trim())) {
      nextErrors.mobile = 'Use BD format: 01XXXXXXXXX'
    }
    if (!form.address.trim()) nextErrors.address = 'Business address is required'
    if (!form.city.trim()) nextErrors.city = 'City is required'
    if (!form.postalCode.trim()) nextErrors.postalCode = 'Postal code is required'
    if (!otpVerified) nextErrors.otp = 'Verify OTP to continue'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const validateStep3 = () => {
    const nextErrors: Record<string, string> = {}
    if (!form.bankName) nextErrors.bankName = 'Select a bank'
    if (!form.accountHolderName.trim()) nextErrors.accountHolderName = 'Account holder name is required'
    if (!form.accountNumber.trim()) {
      nextErrors.accountNumber = 'Account number is required'
    } else if (!BANK_ACCOUNT_REGEX.test(form.accountNumber.trim())) {
      nextErrors.accountNumber = 'Account number must be at least 10 digits'
    }
    if (!form.branchName.trim()) nextErrors.branchName = 'Branch name is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSendOtp = () => {
    if (!BD_MOBILE_REGEX.test(form.mobile.trim())) {
      setErrors((prev) => ({
        ...prev,
        mobile: 'Enter a valid BD number before sending OTP',
      }))
      return
    }
    setOtpSent(true)
    setOtpVerified(false)
    setOtpValue('')
    setOtpCooldown(60)
    setErrors((prev) => ({ ...prev, otp: '' }))
  }

  const handleVerifyOtp = () => {
    if (!/^\d{6}$/.test(otpValue)) {
      setErrors((prev) => ({ ...prev, otp: 'Enter a valid 6-digit OTP' }))
      return
    }
    setOtpVerified(true)
    setErrors((prev) => ({ ...prev, otp: '' }))
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2)
    if (step === 2 && validateStep2()) setStep(3)
  }

  const handleBack = () => {
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
  }

  const handleSubmit = async () => {
    if (!validateStep3()) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccess(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 items-start">
          <section className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
              <BadgeCheck size={16} />
              Seller Central
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Start Selling on BoroBepari
              </h1>
              <p className="mt-3 text-base sm:text-lg text-slate-600">
                Reach thousands of wholesale buyers across Bangladesh
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <BenefitCard icon={ShieldCheck} title="Zero listing fees" />
              <BenefitCard icon={CreditCard} title="Instant payment settlements" />
              <BenefitCard icon={Headset} title="24/7 seller support" />
              <BenefitCard icon={LineChart} title="Analytics dashboard" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500">
                Need help? Our onboarding specialists can guide you through verification and first listings.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Smartphone size={16} />
                Schedule a call
              </button>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
            {!success ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Step {step}/3</span>
                    <span>Registration Progress</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full">
                    <div
                      className="h-2 bg-orange-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <StepBadge active={step === 1} label="Business" />
                    <StepBadge active={step === 2} label="Contact" />
                    <StepBadge active={step === 3} label="Bank" />
                  </div>
                </div>

                <div className="mt-6">
                  {step === 1 && (
                    <div className="space-y-4">
                      <Field
                        label="Business name"
                        required
                        value={form.businessName}
                        onChange={(value) => updateField('businessName', value)}
                        error={errors.businessName}
                      />
                      <SelectField
                        label="Business type"
                        required
                        value={form.businessType}
                        onChange={(value) => updateField('businessType', value)}
                        options={BUSINESS_TYPES}
                        error={errors.businessType}
                      />
                      <Field
                        label="Trade license number"
                        required
                        value={form.tradeLicenseNumber}
                        onChange={(value) => updateField('tradeLicenseNumber', value)}
                        error={errors.tradeLicenseNumber}
                      />
                      <SelectField
                        label="Business category"
                        required
                        value={form.businessCategory}
                        onChange={(value) => updateField('businessCategory', value)}
                        options={BUSINESS_CATEGORIES}
                        error={errors.businessCategory}
                      />
                      <Field
                        label="Years in business"
                        type="number"
                        value={form.yearsInBusiness}
                        onChange={(value) => updateField('yearsInBusiness', value)}
                      />
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-full rounded-lg bg-orange-600 text-white py-3 text-sm font-semibold hover:bg-orange-700 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <Field
                        label="Full name (owner/manager)"
                        required
                        value={form.fullName}
                        onChange={(value) => updateField('fullName', value)}
                        error={errors.fullName}
                      />
                      <Field
                        label="Email address"
                        required
                        value={form.email}
                        onChange={(value) => updateField('email', value)}
                        error={errors.email}
                      />
                      <div>
                        <Field
                          label="Mobile number"
                          required
                          value={form.mobile}
                          onChange={(value) => updateField('mobile', value)}
                          error={errors.mobile}
                          placeholder="01XXXXXXXXX"
                        />
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpCooldown > 0}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {otpSent ? 'Resend OTP' : 'Send OTP'}
                          </button>
                          {otpCooldown > 0 && (
                            <span className="text-xs text-slate-500">
                              Resend available in {otpCooldown}s
                            </span>
                          )}
                        </div>
                        {otpSent && (
                          <div className="mt-3 flex flex-col sm:flex-row gap-3">
                            <input
                              value={otpValue}
                              onChange={(event) => setOtpValue(event.target.value)}
                              placeholder="Enter 6-digit OTP"
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              className="rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
                            >
                              {otpVerified ? 'Verified' : 'Verify OTP'}
                            </button>
                          </div>
                        )}
                        {errors.otp && (
                          <p className="mt-2 text-xs text-red-500">{errors.otp}</p>
                        )}
                      </div>
                      <Field
                        label="Business address"
                        required
                        value={form.address}
                        onChange={(value) => updateField('address', value)}
                        error={errors.address}
                        textarea
                      />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field
                          label="City"
                          required
                          value={form.city}
                          onChange={(value) => updateField('city', value)}
                          error={errors.city}
                        />
                        <Field
                          label="Postal code"
                          required
                          value={form.postalCode}
                          onChange={(value) => updateField('postalCode', value)}
                          error={errors.postalCode}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleBack}
                          className="w-full rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleNext}
                          className="w-full rounded-lg bg-orange-600 text-white py-3 text-sm font-semibold hover:bg-orange-700 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <SelectField
                        label="Bank name"
                        required
                        value={form.bankName}
                        onChange={(value) => updateField('bankName', value)}
                        options={BANKS}
                        error={errors.bankName}
                      />
                      <Field
                        label="Account holder name"
                        required
                        value={form.accountHolderName}
                        onChange={(value) => updateField('accountHolderName', value)}
                        error={errors.accountHolderName}
                      />
                      <Field
                        label="Account number"
                        required
                        value={form.accountNumber}
                        onChange={(value) => updateField('accountNumber', value)}
                        error={errors.accountNumber}
                      />
                      <Field
                        label="Branch name"
                        required
                        value={form.branchName}
                        onChange={(value) => updateField('branchName', value)}
                        error={errors.branchName}
                      />
                      <Field
                        label="Routing number (optional)"
                        value={form.routingNumber}
                        onChange={(value) => updateField('routingNumber', value)}
                      />
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleBack}
                          className="w-full rounded-lg border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="w-full rounded-lg bg-orange-600 text-white py-3 text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <BadgeCheck className="text-green-600" size={28} />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-slate-900">
                  Account Created Successfully!
                </h2>
                <p className="mt-2 text-slate-600">
                  Complete KYC to start selling
                </p>
                <p className="mt-6 text-sm text-slate-500">
                  Redirecting you to KYC in a few seconds...
                </p>
              </div>
            )}

            {!success && (
              <div className="mt-8 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/seller/login" className="font-semibold text-orange-600 hover:text-orange-700">
                  Sign in
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function BenefitCard({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <Icon size={18} />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
    </div>
  )
}

function StepBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-xs uppercase tracking-wide ${
        active ? 'text-orange-600' : 'text-slate-400'
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-orange-500' : 'bg-slate-300'}`}
      />
      {label}
    </span>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  error,
  type = 'text',
  placeholder,
  textarea,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
  type?: string
  placeholder?: string
  textarea?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      )}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  required,
  error,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
  options: string[]
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200 bg-white"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
