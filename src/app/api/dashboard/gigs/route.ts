import { NextRequest } from 'next/server';
import { listGigs, getSessionUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    const session = token ? await getSessionUser(token) : null;

    if (!session) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const gigs = await listGigs({ userId: session.user_id });

    return Response.json({ gigs });
  } catch (error) {
    console.error('Dashboard gigs error:', error);
    return Response.json({ error: 'Failed to load gigs' }, { status: 500 });
  }
}
