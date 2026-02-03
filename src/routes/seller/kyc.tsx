import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  FileText,
  Building2,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerAuth } from '@/contexts/SellerAuthContext'

export const Route = createFileRoute('/seller/kyc')({
  component: SellerKYCPage,
})

function SellerKYCPage() {
  const { seller } = useSellerAuth()

  const getStatusConfig = () => {
    switch (seller?.kycStatus) {
      case 'approved':
        return {
          icon: CheckCircle2,
          iconColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          title: 'KYC Verified',
          description: 'Your account has been verified. You can now access all seller features.',
        }
      case 'submitted':
        return {
          icon: Clock,
          iconColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          title: 'Verification Pending',
          description: 'Your documents are under review. This usually takes 1-2 business days.',
        }
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          title: 'Verification Failed',
          description: 'Your documents were rejected. Please review and resubmit.',
        }
      default:
        return {
          icon: AlertCircle,
          iconColor: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          title: 'Verification Required',
          description: 'Complete your KYC verification to start selling on BoroBepari.',
        }
    }
  }

  const status = getStatusConfig()
  const StatusIcon = status.icon

  return (
    <SellerProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Status Banner */}
        <div className={`${status.bgColor} ${status.borderColor} border rounded-xl p-6`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-full ${status.bgColor} flex items-center justify-center flex-shrink-0`}>
              <StatusIcon size={24} className={status.iconColor} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {status.title}
              </h2>
              <p className="text-gray-600 mt-1">
                {status.description}
              </p>
              {seller?.kycStatus === 'approved' && (
                <Link
                  to="/seller/dashboard"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* KYC Form - Only show if not approved */}
        {seller?.kycStatus !== 'approved' && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Business Verification
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Please provide the following documents to verify your business
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Business Documents */}
              <DocumentUploadSection
                icon={Building2}
                title="Trade License"
                description="Upload your valid trade license"
                required
              />

              <DocumentUploadSection
                icon={FileText}
                title="TIN Certificate"
                description="Upload your Tax Identification Number certificate"
                required
              />

              <DocumentUploadSection
                icon={CreditCard}
                title="National ID / Passport"
                description="Upload your NID or Passport for identity verification"
                required
              />

              <DocumentUploadSection
                icon={FileText}
                title="Bank Statement"
                description="Upload a recent bank statement (last 3 months)"
              />
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  All documents will be reviewed within 1-2 business days
                </p>
                <button
                  disabled
                  className="px-6 py-2.5 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification Benefits */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Benefits of Verification
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BenefitItem text="Access to all seller features" />
            <BenefitItem text="Priority customer support" />
            <BenefitItem text="Verified seller badge on products" />
            <BenefitItem text="Higher visibility in search results" />
            <BenefitItem text="Ability to receive direct orders" />
            <BenefitItem text="Participate in RFQ marketplace" />
          </div>
        </div>
      </div>
    </SellerProtectedRoute>
  )
}

interface DocumentUploadSectionProps {
  icon: React.ElementType
  title: string
  description: string
  required?: boolean
}

function DocumentUploadSection({
  icon: Icon,
  title,
  description,
  required,
}: DocumentUploadSectionProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-gray-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">{title}</h4>
          {required && (
            <span className="text-xs text-red-500">*Required</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        <button className="mt-3 flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          <Upload size={16} />
          Upload Document
        </button>
      </div>
    </div>
  )
}

function BenefitItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 size={16} className="text-green-500" />
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}
