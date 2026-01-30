import { NextRequest } from 'next/server';
import { getSessionUser, db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('session')?.value;
    const session = token ? getSessionUser(token) : null;

    const { id } = await params;

    // Check if user owns this gig
    const gig = db.prepare('SELECT * FROM gigs WHERE id = ?').get(id) as any;
    if (!gig) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }

    // Only owner can see deliverables
    if (!session || gig.user_id !== session.user_id) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    const deliverables = db.prepare(`
      SELECT d.*, b.name as bee_name
      FROM deliverables d
      JOIN bees b ON d.bee_id = b.id
      WHERE d.gig_id = ?
      ORDER BY d.created_at DESC
    `).all(id);

    return Response.json({ deliverables });
  } catch (error) {
    console.error('Get deliverables error:', error);
    return Response.json({ error: 'Failed to get deliverables' }, { status: 500 });
  }
}
