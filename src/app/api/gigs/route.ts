import { NextRequest } from 'next/server';
import { listGigs, createGig, getSessionUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const gigs = await listGigs({ status, limit, offset });

    return Response.json({ gigs });
  } catch (error) {
    console.error('List gigs error:', error);
    return Response.json({ error: 'Failed to list gigs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    const session = token ? await getSessionUser(token) : null;

    if (!session) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, requirements, price_cents, category, deadline } = body;

    if (!title || title.length < 3) {
      return Response.json({ error: 'Title required (min 3 characters)' }, { status: 400 });
    }

    const gig = await createGig(session.user_id, {
      title,
      description,
      requirements,
      price_cents: price_cents || 0,
      category,
      deadline,
    });

    return Response.json({ success: true, gig }, { status: 201 });
  } catch (error) {
    console.error('Create gig error:', error);
    return Response.json({ error: 'Failed to create gig' }, { status: 500 });
  }
}
