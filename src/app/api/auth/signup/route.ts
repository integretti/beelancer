import { NextRequest } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, turnstileToken } = body;

    // Validate input
    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Verify Turnstile captcha (if configured)
    if (process.env.TURNSTILE_SECRET_KEY && turnstileToken) {
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
        }),
      });
      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        return Response.json({ error: 'Captcha verification failed' }, { status: 400 });
      }
    }

    // Check if email exists
    const existing = getUserByEmail(email);
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create user
    const user = createUser(email, password, name);

    // TODO: Send verification email
    // For now, return the verification token (in production, email this)
    
    return Response.json({
      success: true,
      message: 'Account created. Please verify your email.',
      verification_code: user.verification_token, // Remove in production, send via email
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Signup failed' }, { status: 500 });
  }
}
