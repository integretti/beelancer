import { NextRequest } from 'next/server';
import { db, awardPoints, updateAgentReputation } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Approve bounty completion (human action)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: bountyId } = params;
  const body = await request.json();
  const { rating, comment, bonus_points } = body;

  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(bountyId) as any;
  if (!bounty) {
    return Response.json({ error: 'Bounty not found' }, { status: 404 });
  }

  if (bounty.status !== 'review') {
    return Response.json({ error: 'Bounty is not in review' }, { status: 400 });
  }

  if (!bounty.selected_agent) {
    return Response.json({ error: 'No agent assigned to this bounty' }, { status: 400 });
  }

  // Validate rating
  const finalRating = Math.min(5, Math.max(1, parseInt(rating) || 5));

  // Award points
  let totalPoints = bounty.reward_points;
  awardPoints(bounty.selected_agent, bountyId, bounty.reward_points, 'bounty_completed', `Completed: ${bounty.title}`);

  if (bonus_points && bonus_points > 0) {
    awardPoints(bounty.selected_agent, bountyId, bonus_points, 'bonus', 'Bonus for exceptional work');
    totalPoints += bonus_points;
  }

  // Create review
  const reviewId = uuidv4();
  db.prepare(`
    INSERT INTO reviews (id, bounty_id, agent_id, human_id, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(reviewId, bountyId, bounty.selected_agent, bounty.human_id, finalRating, comment || null);

  // Update agent reputation
  updateAgentReputation(bounty.selected_agent);

  // Mark bounty complete
  db.prepare(`
    UPDATE bounties SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(bountyId);

  // Update deliverables
  db.prepare("UPDATE deliverables SET status = 'approved' WHERE bounty_id = ?").run(bountyId);

  const agent = db.prepare('SELECT name, points, reputation, jobs_completed FROM agents WHERE id = ?')
    .get(bounty.selected_agent) as any;

  return Response.json({
    success: true,
    message: `Bounty completed! ${agent?.name} earned ${totalPoints} points. 🎉`,
    agent: {
      name: agent?.name,
      points: agent?.points,
      reputation: agent?.reputation,
      jobs_completed: agent?.jobs_completed
    }
  });
}

// Request revision (human action)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id: bountyId } = params;
  const body = await request.json();
  const { feedback } = body;

  if (!feedback) {
    return Response.json({ error: 'feedback is required' }, { status: 400 });
  }

  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(bountyId) as any;
  if (!bounty) {
    return Response.json({ error: 'Bounty not found' }, { status: 404 });
  }

  // Update latest deliverable with feedback
  db.prepare(`
    UPDATE deliverables 
    SET status = 'revision_requested', feedback = ?
    WHERE bounty_id = ? AND status = 'submitted'
  `).run(feedback, bountyId);

  // Put bounty back to in_progress
  db.prepare("UPDATE bounties SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(bountyId);

  return Response.json({
    success: true,
    message: 'Revision requested. The agent will be notified.'
  });
}
