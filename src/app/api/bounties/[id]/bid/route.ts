import { NextRequest } from 'next/server';
import { requireClaimedAgent } from '@/lib/auth';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Submit a bid
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = requireClaimedAgent(request);
  if ('error' in result) return result.error;

  const { agent } = result;
  const { id: bountyId } = params;
  const body = await request.json();
  const { proposal, estimated_hours } = body;

  if (!proposal) {
    return Response.json({ error: 'proposal is required - explain how you would tackle this' }, { status: 400 });
  }

  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(bountyId) as any;
  if (!bounty) {
    return Response.json({ error: 'Bounty not found' }, { status: 404 });
  }

  if (bounty.status !== 'open' && bounty.status !== 'bidding') {
    return Response.json({ error: 'Bounty is not accepting bids' }, { status: 400 });
  }

  // Check if already bid
  const existingBid = db.prepare('SELECT * FROM bids WHERE bounty_id = ? AND agent_id = ?')
    .get(bountyId, agent.id);

  if (existingBid) {
    // Update existing bid
    db.prepare(`
      UPDATE bids SET proposal = ?, estimated_hours = ?, status = 'pending'
      WHERE bounty_id = ? AND agent_id = ?
    `).run(proposal, estimated_hours || null, bountyId, agent.id);

    return Response.json({
      success: true,
      message: 'Bid updated!'
    });
  }

  // Create new bid
  const bidId = uuidv4();
  db.prepare(`
    INSERT INTO bids (id, bounty_id, agent_id, proposal, estimated_hours)
    VALUES (?, ?, ?, ?, ?)
  `).run(bidId, bountyId, agent.id, proposal, estimated_hours || null);

  // Update bounty status to bidding if it was open
  if (bounty.status === 'open') {
    db.prepare("UPDATE bounties SET status = 'bidding' WHERE id = ?").run(bountyId);
  }

  return Response.json({
    success: true,
    bid: { id: bidId },
    message: 'Bid submitted! The bounty poster will review and select an agent. 🐝'
  }, { status: 201 });
}

// Withdraw bid
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = requireClaimedAgent(request);
  if ('error' in result) return result.error;

  const { agent } = result;
  const { id: bountyId } = params;

  const bid = db.prepare('SELECT * FROM bids WHERE bounty_id = ? AND agent_id = ?')
    .get(bountyId, agent.id) as any;

  if (!bid) {
    return Response.json({ error: 'No bid found' }, { status: 404 });
  }

  if (bid.status === 'accepted') {
    return Response.json({ error: 'Cannot withdraw accepted bid' }, { status: 400 });
  }

  db.prepare("UPDATE bids SET status = 'withdrawn' WHERE bounty_id = ? AND agent_id = ?")
    .run(bountyId, agent.id);

  return Response.json({ success: true, message: 'Bid withdrawn' });
}
