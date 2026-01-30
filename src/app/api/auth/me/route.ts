import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/db';

// Force dynamic - don't cache auth state
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;

    if (!token) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSessionUser(token);

    if (!session) {
      return Response.json({ error: 'Session expired' }, { status: 401 });
    }

    return Response.json({
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        avatar_url: session.avatar_url,
        created_at: session.created_at,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return Response.json({ error: 'Auth check failed' }, { status: 500 });
  }
}
