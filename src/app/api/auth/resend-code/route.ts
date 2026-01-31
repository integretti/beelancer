import { NextRequest } from 'next/server';
import { getUserByEmail, regenerateVerificationCode, getLastCodeSentAt } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return Response.json({ success: true, message: 'If this email exists, a new code has been sent.' });
    }

    if (user.email_verified) {
      return Response.json({ error: 'Email already verified' }, { status: 400 });
    }

    // Check rate limit (1 minute)
    const lastSentAt = await getLastCodeSentAt(user.id);
    if (lastSentAt) {
      const timeSince = Date.now() - new Date(lastSentAt).getTime();
      const cooldownMs = 60 * 1000; // 1 minute
      if (timeSince < cooldownMs) {
        const waitSeconds = Math.ceil((cooldownMs - timeSince) / 1000);
        return Response.json({ 
          error: 'Please wait before requesting another code',
          wait_seconds: waitSeconds 
        }, { status: 429 });
      }
    }

    // Generate new code
    const newCode = await regenerateVerificationCode(user.id);

    // Send email
    try {
      await sendVerificationEmail(email, newCode, user.name);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return Response.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: 'Verification code sent',
      cooldown_seconds: 60
    });
  } catch (error) {
    console.error('Resend code error:', error);
    return Response.json({ error: 'Failed to resend code' }, { status: 500 });
  }
}
