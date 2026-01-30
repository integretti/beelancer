import { NextRequest } from 'next/server';
import { getSessionUser, getGigById } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('session')?.value;
    const session = token ? await getSessionUser(token) : null;

    const { id } = await params;

    const gig = await getGigById(id) as any;
    if (!gig) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }

    // Only owner can see deliverables
    if (!session || gig.user_id !== session.user_id) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    // For now, return empty - deliverables query would need to be added to db.ts
    return Response.json({ deliverables: [] });
  } catch (error) {
    console.error('Get deliverables error:', error);
    return Response.json({ error: 'Failed to get deliverables' }, { status: 500 });
  }
}
