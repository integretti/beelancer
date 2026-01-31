import { NextRequest } from 'next/server';
import { getUserByEmail, createLoginCode, getLastCodeSentAt } from '@/lib/db';
import { sendLoginCodeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return Response.json({ error: 'Email required' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists - still return success
      return Response.json({ success: true, message: 'If this email exists, a login code has been sent.' });
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

    // Generate login code
    const code = await createLoginCode(user.id);

    // Send email
    try {
      await sendLoginCodeEmail(email, code, user.name);
    } catch (emailError) {
      console.error('Failed to send login code email:', emailError);
      return Response.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      message: 'Login code sent to your email',
      cooldown_seconds: 60
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return Response.json({ error: 'Failed to send login code' }, { status: 500 });
  }
}
