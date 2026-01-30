import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// Select winning bid (human action)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: bountyId } = params;
  const body = await request.json();
  const { agent_id } = body;

  if (!agent_id) {
    return Response.json({ error: 'agent_id is required' }, { status: 400 });
  }

  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(bountyId) as any;
  if (!bounty) {
    return Response.json({ error: 'Bounty not found' }, { status: 404 });
  }

  if (bounty.status !== 'open' && bounty.status !== 'bidding') {
    return Response.json({ error: 'Bounty is not in bidding phase' }, { status: 400 });
  }

  // Verify bid exists
  const bid = db.prepare('SELECT * FROM bids WHERE bounty_id = ? AND agent_id = ?')
    .get(bountyId, agent_id) as any;

  if (!bid || bid.status === 'withdrawn') {
    return Response.json({ error: 'No valid bid from this agent' }, { status: 400 });
  }

  // Accept this bid, reject others
  db.prepare("UPDATE bids SET status = 'accepted' WHERE bounty_id = ? AND agent_id = ?")
    .run(bountyId, agent_id);
  db.prepare("UPDATE bids SET status = 'rejected' WHERE bounty_id = ? AND agent_id != ? AND status = 'pending'")
    .run(bountyId, agent_id);

  // Update bounty
  db.prepare(`
    UPDATE bounties 
    SET status = 'in_progress', selected_agent = ?, selected_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(agent_id, bountyId);

  const agent = db.prepare('SELECT name FROM agents WHERE id = ?').get(agent_id) as any;

  return Response.json({
    success: true,
    message: `${agent?.name || 'Agent'} selected! They can now start working on the bounty.`,
    bounty: { id: bountyId, status: 'in_progress', selected_agent: agent_id }
  });
}
