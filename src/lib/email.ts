import { Resend } from 'resend'

// Initialize Resend conditionally or with a placeholder if missing
// The actual send call will be skipped if we detect it's missing/invalid in dev
const apiKey = process.env.RESEND_API_KEY || 're_123456789'
const resend = new Resend(apiKey)

interface EmailParams {
  email: string
  url?: string
  name: string
  type?: 'verification' | 'reset-password'
  code?: string
}

interface InvoiceEmailParams {
  email: string
  name: string
  invoiceNumber: string
  invoiceUrl: string
  orderNumber: string
}

interface CancellationEmailParams {
  email: string
  name: string
  orderNumber: string
  refundSummary: string
}

export async function sendVerificationEmail({
  email,
  url,
  name,
  type = 'verification',
  code,
}: EmailParams) {
  const isReset = type === 'reset-password'
  const subject = isReset
    ? 'Reset your BoroBepari password'
    : 'Verify your BoroBepari account'
  const title = isReset
    ? 'Password Reset Request'
    : `Welcome to BoroBepari, ${name}!`

  let body = ''
  if (isReset) {
    body = code
      ? 'We received a request to reset your password. Use the following code to proceed:'
      : 'We received a request to reset your password. Click the button below to choose a new one:'
  } else {
    body =
      'Thank you for joining our wholesale marketplace. To get started, please verify your email address by clicking the button below:'
  }

  const buttonText = isReset ? 'Reset Password' : 'Verify Email Address'

  // LOG FOR DEVELOPMENT: Ensure we can see the code/link even if email fails
  if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
    console.log('--- EMAIL DEBUG ---')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    if (code) console.log(`CODE: ${code}`)
    if (url) console.log(`URL: ${url}`)
    console.log('-------------------')

    if (!process.env.RESEND_API_KEY) {
      console.warn(
        '⚠️ RESEND_API_KEY is missing. Email sending is skipped (simulated success).',
      )
      return { success: true, data: { id: 'mock-email-id' } }
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'BoroBepari <onboarding@resend.dev>',
      to: [email],
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ea580c;">${title}</h2>
          <p>${body}</p>
          
          ${
            code
              ? `
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1f2937;">${code}</span>
            </div>
            <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          `
              : `
            <div style="margin: 30px 0; text-align: center;">
              <a href="${url}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                ${buttonText}
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #ea580c; font-size: 12px;">${url}</p>
          `
          }

          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })

    if (error) {
      console.error(`Failed to send ${type} email:`, error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error(`Unexpected error sending ${type} email:`, err)
    return { success: false, error: err }
  }
}

export async function sendInvoiceEmail({
  email,
  name,
  invoiceNumber,
  invoiceUrl,
  orderNumber,
}: InvoiceEmailParams) {
  const subject = `Your BoroBepari Invoice ${invoiceNumber}`
  const title = 'Your invoice is ready'

  if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
    console.log('--- EMAIL DEBUG ---')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log(`Invoice URL: ${invoiceUrl}`)
    console.log('-------------------')

    if (!process.env.RESEND_API_KEY) {
      console.warn(
        '⚠️ RESEND_API_KEY is missing. Email sending is skipped (simulated success).',
      )
      return { success: true, data: { id: 'mock-email-id' } }
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'BoroBepari <billing@resend.dev>',
      to: [email],
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #16a34a;">${title}</h2>
          <p>Hello ${name},</p>
          <p>Your invoice for order <strong>${orderNumber}</strong> is ready.</p>
          <p>Invoice Number: <strong>${invoiceNumber}</strong></p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${invoiceUrl}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Download Invoice
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link:</p>
          <p style="word-break: break-all; color: #16a34a; font-size: 12px;">${invoiceUrl}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">Thank you for your business.</p>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send invoice email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error sending invoice email:', err)
    return { success: false, error: err }
  }
}

export async function sendCancellationEmail({
  email,
  name,
  orderNumber,
  refundSummary,
}: CancellationEmailParams) {
  const subject = `Your order ${orderNumber} has been cancelled`
  const title = 'Order cancelled'

  if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
    console.log('--- EMAIL DEBUG ---')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log(`Refund: ${refundSummary}`)
    console.log('-------------------')

    if (!process.env.RESEND_API_KEY) {
      console.warn(
        '⚠️ RESEND_API_KEY is missing. Email sending is skipped (simulated success).',
      )
      return { success: true, data: { id: 'mock-email-id' } }
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'BoroBepari <billing@resend.dev>',
      to: [email],
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #dc2626;">${title}</h2>
          <p>Hello ${name},</p>
          <p>Your order <strong>${orderNumber}</strong> has been cancelled.</p>
          <p>${refundSummary}</p>
          <p style="color: #666; font-size: 14px;">Refunds are processed to the original payment method within 3-5 business days.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">If you have questions, reply to this email or contact support.</p>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send cancellation email:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error('Unexpected error sending cancellation email:', err)
    return { success: false, error: err }
  }
}
