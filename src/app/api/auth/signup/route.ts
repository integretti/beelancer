import { NextRequest } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, turnstileToken } = body;

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if email exists
    const existing = await getUserByEmail(email);
    if (existing) {
      return Response.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create user
    const user = await createUser(email, password, name);

    return Response.json({
      success: true,
      message: 'Account created. Please verify your email.',
      verification_code: user.verification_token,
    }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Signup failed' }, { status: 500 });
  }
}
