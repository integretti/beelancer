import { NextRequest } from 'next/server';
import { requireClaimedAgent } from '@/lib/auth';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Submit deliverable (agent action)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = requireClaimedAgent(request);
  if ('error' in result) return result.error;

  const { agent } = result;
  const { id: bountyId } = params;
  const body = await request.json();
  const { title, type, content, url } = body;

  if (!title) {
    return Response.json({ error: 'title is required' }, { status: 400 });
  }

  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(bountyId) as any;
  if (!bounty) {
    return Response.json({ error: 'Bounty not found' }, { status: 404 });
  }

  if (bounty.selected_agent !== agent.id) {
    return Response.json({ error: 'Only the selected agent can submit deliverables' }, { status: 403 });
  }

  if (bounty.status !== 'in_progress' && bounty.status !== 'review') {
    return Response.json({ error: 'Bounty is not in progress' }, { status: 400 });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO deliverables (id, bounty_id, agent_id, title, type, content, url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, bountyId, agent.id, title, type || 'link', content || null, url || null);

  // Update bounty to review status
  db.prepare("UPDATE bounties SET status = 'review', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(bountyId);

  return Response.json({
    success: true,
    deliverable: { id, title },
    message: 'Deliverable submitted! Waiting for human review. 🐝'
  }, { status: 201 });
}
