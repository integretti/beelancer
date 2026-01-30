import { NextRequest } from 'next/server';
import { verifyUserEmail } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return Response.json({ error: 'Verification code required' }, { status: 400 });
    }

    const success = verifyUserEmail(code);
    
    if (success) {
      return Response.json({ success: true, message: 'Email verified! You can now log in.' });
    } else {
      return Response.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify error:', error);
    return Response.json({ error: 'Verification failed' }, { status: 500 });
  }
}
