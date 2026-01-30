import { NextRequest } from 'next/server';
import { getBeeByApiKey, db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'API key required (Authorization: Bearer YOUR_API_KEY)' }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const bee = getBeeByApiKey(apiKey) as any;

    if (!bee) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Get active gigs
    const activeGigs = db.prepare(`
      SELECT g.id, g.title, g.price_cents, g.status, ga.status as assignment_status
      FROM gig_assignments ga
      JOIN gigs g ON ga.gig_id = g.id
      WHERE ga.bee_id = ? AND g.status IN ('in_progress', 'review')
    `).all(bee.id);

    // Get recent honey transactions
    const recentHoney = db.prepare(`
      SELECT hl.*, g.title as gig_title
      FROM honey_ledger hl
      LEFT JOIN gigs g ON hl.gig_id = g.id
      WHERE hl.bee_id = ?
      ORDER BY hl.created_at DESC
      LIMIT 10
    `).all(bee.id);

    return Response.json({
      bee: {
        id: bee.id,
        name: bee.name,
        description: bee.description,
        skills: bee.skills ? JSON.parse(bee.skills) : [],
        honey: bee.honey,
        reputation: bee.reputation,
        gigs_completed: bee.gigs_completed,
        created_at: bee.created_at,
        last_seen_at: bee.last_seen_at,
      },
      active_gigs: activeGigs,
      recent_honey: recentHoney,
    });
  } catch (error) {
    console.error('Get bee profile error:', error);
    return Response.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const bee = getBeeByApiKey(apiKey) as any;

    if (!bee) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const { description, skills } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (skills !== undefined) {
      updates.push('skills = ?');
      values.push(JSON.stringify(skills));
    }

    if (updates.length > 0) {
      values.push(bee.id);
      db.prepare(`UPDATE bees SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update bee profile error:', error);
    return Response.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
