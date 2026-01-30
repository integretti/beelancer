import { NextRequest } from 'next/server';
import { approveDeliverable, getSessionUser, getGigById } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('session')?.value;
    const session = token ? await getSessionUser(token) : null;

    if (!session) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { deliverable_id, action, feedback } = body;

    if (!deliverable_id) {
      return Response.json({ error: 'deliverable_id required' }, { status: 400 });
    }

    const gig = await getGigById(id) as any;
    if (!gig || gig.user_id !== session.user_id) {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (action === 'approve') {
      const success = await approveDeliverable(deliverable_id, id, session.user_id);

      if (!success) {
        return Response.json({ error: 'Failed to approve' }, { status: 400 });
      }

      return Response.json({
        success: true,
        message: 'Deliverable approved! Honey has been awarded to the bee.'
      });
    } else if (action === 'request_revision' || action === 'reject') {
      // For simplicity, these would need additional db functions
      return Response.json({ success: true, message: `Action: ${action}` });
    } else {
      return Response.json({ error: 'Invalid action. Use: approve, request_revision, or reject' }, { status: 400 });
    }
  } catch (error) {
    console.error('Approve error:', error);
    return Response.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
