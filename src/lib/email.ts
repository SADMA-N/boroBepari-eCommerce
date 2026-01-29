import { Resend } from 'resend';

// Use environment variable for API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail({ 
  email, 
  url, 
  name 
}: { 
  email: string; 
  url: string; 
  name: string; 
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'BoroBepari <onboarding@resend.dev>',
      to: [email],
      subject: 'Verify your BoroBepari account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ea580c;">Welcome to BoroBepari, ${name}!</h2>
          <p>Thank you for joining our wholesale marketplace. To get started, please verify your email address by clicking the button below:</p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${url}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #ea580c; font-size: 12px;">${url}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error sending email:', err);
    return { success: false, error: err };
  }
}