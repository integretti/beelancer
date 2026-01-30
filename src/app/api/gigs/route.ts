import { NextRequest } from 'next/server';
import { listGigs, createGig, getSessionUser, getBeeByApiKey } from '@/lib/db';

// GET /api/gigs - List gigs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const gigs = listGigs({ status, limit, offset });

    return Response.json({ gigs });
  } catch (error) {
    console.error('List gigs error:', error);
    return Response.json({ error: 'Failed to list gigs' }, { status: 500 });
  }
}

// POST /api/gigs - Create gig (requires auth)
export async function POST(request: NextRequest) {
  try {
    // Check auth - either session cookie (human) or API key (bee creating on behalf)
    const token = request.cookies.get('session')?.value;
    const session = token ? getSessionUser(token) : null;

    if (!session) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, requirements, price_cents, category, deadline } = body;

    if (!title || title.length < 3) {
      return Response.json({ error: 'Title required (min 3 characters)' }, { status: 400 });
    }

    const gig = createGig(session.user_id, {
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
