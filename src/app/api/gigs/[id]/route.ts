import { NextRequest } from 'next/server';
import { getGigById, updateGig, getSessionUser, getBidsForGig } from '@/lib/db';

// GET /api/gigs/:id - Get gig details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gig = getGigById(id);

    if (!gig) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }

    // Get bids for this gig
    const bids = getBidsForGig(id);

    return Response.json({ gig, bids });
  } catch (error) {
    console.error('Get gig error:', error);
    return Response.json({ error: 'Failed to get gig' }, { status: 500 });
  }
}

// PATCH /api/gigs/:id - Update gig
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('session')?.value;
    const session = token ? getSessionUser(token) : null;

    if (!session) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Only allow updating certain fields
    const allowedFields = ['title', 'description', 'requirements', 'price_cents', 'category', 'deadline', 'status'];
    const updates: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    updateGig(id, session.user_id, updates);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update gig error:', error);
    return Response.json({ error: 'Failed to update gig' }, { status: 500 });
  }
}
