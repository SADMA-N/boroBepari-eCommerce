import nodemailer from 'nodemailer'
import { env } from '../env'

// Initialize Nodemailer transporter with SMTP settings
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

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

interface OrderStatusEmailParams {
  email: string
  name: string
  orderNumber: string
  statusLabel: string
  trackingNumber?: string
  courier?: string
  eta?: string
  orderLink?: string
}

interface StockAlertEmailParams {
  email: string
  name: string
  productName: string
  productImage?: string
  price: string
  moq: string
  productLink: string
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

  // LOG FOR DEVELOPMENT
  if (process.env.NODE_ENV !== 'production') {
    console.log('--- EMAIL DEBUG ---')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    if (code) console.log(`CODE: ${code}`)
    if (url) console.log(`URL: ${url}`)
    console.log('-------------------')
  }

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
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

    return { success: true, data: info }
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

  if (process.env.NODE_ENV !== 'production') {
    console.log('--- EMAIL DEBUG ---')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log(`Invoice URL: ${invoiceUrl}`)
    console.log('-------------------')
  }

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
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

    return { success: true, data: info }
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

  if (process.env.NODE_ENV !== 'production') {
    console.log('--- EMAIL DEBUG ---')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log(`Refund: ${refundSummary}`)
    console.log('-------------------')
  }

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
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

    return { success: true, data: info }
  } catch (err) {
    console.error('Unexpected error sending cancellation email:', err)
    return { success: false, error: err }
  }
}

export async function sendOrderStatusEmail({
  email,
  name,
  orderNumber,
  statusLabel,
  trackingNumber,
  courier,
  eta,
  orderLink,
}: OrderStatusEmailParams) {
  const subject = `Your order ${orderNumber} is ${statusLabel}`

  const trackingBlock = trackingNumber
    ? `
      <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p><strong>Courier:</strong> ${courier ?? 'N/A'}</p>
      <p><strong>Estimated Delivery:</strong> ${eta ?? 'TBD'}</p>
    `
    : ''

  if (process.env.NODE_ENV !== 'production') {
    console.log('--- EMAIL DEBUG ---')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log(`Order link: ${orderLink}`)
    console.log('-------------------')
  }

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #16a34a;">Order update</h2>
          <p>Hi ${name},</p>
          <p>Your order <strong>${orderNumber}</strong> is now <strong>${statusLabel}</strong>.</p>
          ${trackingBlock}
          ${
            orderLink
              ? `
            <div style="margin: 24px 0; text-align: center;">
              <a href="${orderLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                View Order
              </a>
            </div>
          `
              : ''
          }
          <p style="color: #999; font-size: 12px;">Thank you for shopping with BoroBepari.</p>
        </div>
      `,
    })

    return { success: true, data: info }
  } catch (err) {
    console.error('Unexpected error sending order status email:', err)
    return { success: false, error: err }
  }
}

export async function sendStockAlertEmail({
  email,
  name,
  productName,
  productImage,
  price,
  moq,
  productLink,
}: StockAlertEmailParams) {
  const subject = `${productName} is back in stock!`

  if (process.env.NODE_ENV !== 'production') {
    console.log('--- EMAIL DEBUG ---')
    console.log(`To: ${email}`)
    console.log(`Subject: ${subject}`)
    console.log(`Product link: ${productLink}`)
    console.log('-------------------')
  }

  const imageBlock = productImage
    ? `<img src="${productImage}" alt="${productName}" style="width:120px;height:120px;object-fit:cover;border-radius:12px;" />`
    : ''

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #16a34a;">${productName} is back in stock!</h2>
          <p>Hi ${name},</p>
          <p>The product you were waiting for is now available.</p>
          <div style="display:flex; gap:16px; align-items:center; margin:16px 0;">
            ${imageBlock}
            <div>
              <p style="margin:0 0 6px 0;"><strong>Product:</strong> ${productName}</p>
              <p style="margin:0 0 6px 0;"><strong>Price:</strong> ${price}</p>
              <p style="margin:0;"><strong>MOQ:</strong> ${moq}</p>
            </div>
          </div>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${productLink}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Shop Now
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">If you no longer want alerts for this product, you can manage alerts in your account.</p>
        </div>
      `,
    })

    return { success: true, data: info }
  } catch (err) {
    console.error('Unexpected error sending stock alert email:', err)
    return { success: false, error: err }
  }
}
