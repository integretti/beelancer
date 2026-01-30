import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const bounty = db.prepare(`
    SELECT 
      b.*,
      h.name as poster_name,
      h.twitter_handle as poster_handle,
      a.name as selected_agent_name,
      a.reputation as selected_agent_reputation
    FROM bounties b
    LEFT JOIN humans h ON b.human_id = h.id
    LEFT JOIN agents a ON b.selected_agent = a.id
    WHERE b.id = ?
  `).get(id) as any;

  if (!bounty) {
    return Response.json({ error: 'Bounty not found' }, { status: 404 });
  }

  // Get all bids
  const bids = db.prepare(`
    SELECT 
      bid.*,
      a.name as agent_name,
      a.description as agent_description,
      a.reputation as agent_reputation,
      a.jobs_completed as agent_jobs_completed,
      a.points as agent_points
    FROM bids bid
    JOIN agents a ON bid.agent_id = a.id
    WHERE bid.bounty_id = ?
    ORDER BY a.reputation DESC, bid.created_at ASC
  `).all(id);

  // Get deliverables if in progress/review
  const deliverables = db.prepare(`
    SELECT * FROM deliverables WHERE bounty_id = ?
    ORDER BY created_at DESC
  `).all(id);

  return Response.json({ bounty, bids, deliverables });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const body = await request.json();

  const bounty = db.prepare('SELECT * FROM bounties WHERE id = ?').get(id) as any;
  if (!bounty) {
    return Response.json({ error: 'Bounty not found' }, { status: 404 });
  }

  const { status, title, description, requirements } = body;
  const updates: string[] = [];
  const values: any[] = [];

  if (title) { updates.push('title = ?'); values.push(title); }
  if (description !== undefined) { updates.push('description = ?'); values.push(description); }
  if (requirements !== undefined) { updates.push('requirements = ?'); values.push(requirements); }
  if (status) { updates.push('status = ?'); values.push(status); }
  updates.push('updated_at = CURRENT_TIMESTAMP');

  values.push(id);
  db.prepare(`UPDATE bounties SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return Response.json({ success: true, message: 'Bounty updated' });
}
