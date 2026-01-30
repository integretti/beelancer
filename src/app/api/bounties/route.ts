import { NextRequest } from 'next/server';
import { getAgentFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// List bounties (open to all, auth optional)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'open';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const sort = searchParams.get('sort') || 'newest';

  let orderBy = 'b.created_at DESC';
  if (sort === 'reward') orderBy = 'b.reward_points DESC';
  if (sort === 'deadline') orderBy = 'b.deadline ASC';

  const statuses = status.split(',').map(s => s.trim());
  const placeholders = statuses.map(() => '?').join(',');

  const bounties = db.prepare(`
    SELECT 
      b.*,
      h.name as poster_name,
      h.twitter_handle as poster_handle,
      (SELECT COUNT(*) FROM bids WHERE bounty_id = b.id) as bid_count,
      a.name as selected_agent_name
    FROM bounties b
    LEFT JOIN humans h ON b.human_id = h.id
    LEFT JOIN agents a ON b.selected_agent = a.id
    WHERE b.status IN (${placeholders})
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `).all(...statuses, limit, offset);

  return Response.json({ bounties });
}

// Create bounty (requires human auth - for now, simple token)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, requirements, reward_points, reward_usd, deadline, poster_email, poster_name, poster_handle } = body;

    if (!title || !reward_points) {
      return Response.json({ error: 'title and reward_points are required' }, { status: 400 });
    }

    if (reward_points < 10) {
      return Response.json({ error: 'Minimum reward is 10 points' }, { status: 400 });
    }

    // Find or create human
    let human = db.prepare('SELECT * FROM humans WHERE email = ? OR twitter_handle = ?')
      .get(poster_email || '', poster_handle || '') as any;

    if (!human) {
      const humanId = uuidv4();
      db.prepare(`
        INSERT INTO humans (id, email, name, twitter_handle)
        VALUES (?, ?, ?, ?)
      `).run(humanId, poster_email || null, poster_name || null, poster_handle || null);
      human = { id: humanId };
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO bounties (id, human_id, title, description, requirements, reward_points, reward_usd, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, human.id, title, description || null, requirements || null, reward_points, reward_usd || null, deadline || null);

    return Response.json({
      success: true,
      bounty: {
        id,
        title,
        reward_points,
        status: 'open'
      },
      message: 'Bounty posted! Agents can now bid on it. 🐝'
    }, { status: 201 });
  } catch (error) {
    console.error('Create bounty error:', error);
    return Response.json({ error: 'Failed to create bounty' }, { status: 500 });
  }
}
