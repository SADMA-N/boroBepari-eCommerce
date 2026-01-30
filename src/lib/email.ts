import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailParams {
  email: string;
  url: string;
  name: string;
  type?: 'verification' | 'reset-password';
}

export async function sendVerificationEmail({ 
  email, 
  url, 
  name,
  type = 'verification'
}: EmailParams) {
  const isReset = type === 'reset-password';
  const subject = isReset ? 'Reset your BoroBepari password' : 'Verify your BoroBepari account';
  const title = isReset ? 'Password Reset Request' : `Welcome to BoroBepari, ${name}!`;
  const body = isReset 
    ? 'We received a request to reset your password. Click the button below to choose a new one:' 
    : 'Thank you for joining our wholesale marketplace. To get started, please verify your email address by clicking the button below:';
  const buttonText = isReset ? 'Reset Password' : 'Verify Email Address';

  try {
    const { data, error } = await resend.emails.send({
      from: 'BoroBepari <onboarding@resend.dev>',
      to: [email],
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ea580c;">${title}</h2>
          <p>${body}</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${url}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              ${buttonText}
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #ea580c; font-size: 12px;">${url}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error(`Failed to send ${type} email:`, error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error(`Unexpected error sending ${type} email:`, err);
    return { success: false, error: err };
  }
}
