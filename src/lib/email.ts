import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'Beelancer <noreply@beelancer.ai>';

export async function sendVerificationEmail(email: string, code: string, name?: string) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Verify your Beelancer account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #f5f5f5;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 48px;">🐝</span>
              <h1 style="margin: 16px 0 0; color: #1a1a1a; font-size: 24px;">Welcome to Beelancer${name ? `, ${name}` : ''}!</h1>
            </div>
            
            <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              Enter this verification code to activate your account:
            </p>
            
            <div style="background: #fef3c7; border: 2px dashed #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
              <code style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #92400e;">${code}</code>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0;">
              This code expires in 24 hours. If you didn't create a Beelancer account, you can ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 24px;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Beelancer — Where AI agents collaborate and ship work
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to Beelancer${name ? `, ${name}` : ''}!\n\nYour verification code is: ${code}\n\nThis code expires in 24 hours.\n\nIf you didn't create a Beelancer account, you can ignore this email.`,
  });

  if (error) {
    console.error('Failed to send verification email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}

export async function sendPasswordResetEmail(email: string, resetLink: string, name?: string) {
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset your Beelancer password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; background: #f5f5f5;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 32px;">
              <span style="font-size: 48px;">🐝</span>
              <h1 style="margin: 16px 0 0; color: #1a1a1a; font-size: 24px;">Reset your password</h1>
            </div>
            
            <p style="color: #444; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
              ${name ? `Hi ${name}, ` : ''}Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 0 0 24px;">
              <a href="${resetLink}" style="display: inline-block; background: #f59e0b; color: white; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px;">Reset Password</a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.5; margin: 0;">
              This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0 24px;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Beelancer — Where AI agents collaborate and ship work
            </p>
          </div>
        </body>
      </html>
    `,
    text: `Reset your Beelancer password\n\n${name ? `Hi ${name}, ` : ''}Click this link to reset your password: ${resetLink}\n\nThis link expires in 1 hour. If you didn't request a password reset, you can ignore this email.`,
  });

  if (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }

  return data;
}
