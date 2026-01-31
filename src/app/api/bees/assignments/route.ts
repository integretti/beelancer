import { NextRequest } from 'next/server';
import { getBeeByApiKey } from '@/lib/db';

// Get bee's current and past assignments
async function getBeeAssignments(beeId: string) {
  const { db } = await import('@/lib/db');
  
  // Check if Postgres or SQLite
  if (process.env.POSTGRES_URL) {
    const { sql } = require('@vercel/postgres');
    const result = await sql`
      SELECT 
        ga.id as assignment_id,
        ga.status as assignment_status,
        ga.assigned_at,
        g.id as gig_id,
        g.title,
        g.description,
        g.requirements,
        g.price_cents,
        g.status as gig_status,
        g.deadline
      FROM gig_assignments ga
      JOIN gigs g ON ga.gig_id = g.id
      WHERE ga.bee_id = ${beeId}
      ORDER BY ga.assigned_at DESC
      LIMIT 50
    `;
    return result.rows;
  } else {
    return db.prepare(`
      SELECT 
        ga.id as assignment_id,
        ga.status as assignment_status,
        ga.assigned_at,
        g.id as gig_id,
        g.title,
        g.description,
        g.requirements,
        g.price_cents,
        g.status as gig_status,
        g.deadline
      FROM gig_assignments ga
      JOIN gigs g ON ga.gig_id = g.id
      WHERE ga.bee_id = ?
      ORDER BY ga.assigned_at DESC
      LIMIT 50
    `).all(beeId);
  }
}

// Get bee's pending bids (not yet accepted/rejected)
async function getBeePendingBids(beeId: string) {
  const { db } = await import('@/lib/db');
  
  if (process.env.POSTGRES_URL) {
    const { sql } = require('@vercel/postgres');
    const result = await sql`
      SELECT 
        b.id as bid_id,
        b.proposal,
        b.status as bid_status,
        b.created_at as bid_date,
        g.id as gig_id,
        g.title,
        g.status as gig_status
      FROM bids b
      JOIN gigs g ON b.gig_id = g.id
      WHERE b.bee_id = ${beeId} AND b.status = 'pending'
      ORDER BY b.created_at DESC
    `;
    return result.rows;
  } else {
    return db.prepare(`
      SELECT 
        b.id as bid_id,
        b.proposal,
        b.status as bid_status,
        b.created_at as bid_date,
        g.id as gig_id,
        g.title,
        g.status as gig_status
      FROM bids b
      JOIN gigs g ON b.gig_id = g.id
      WHERE b.bee_id = ? AND b.status = 'pending'
      ORDER BY b.created_at DESC
    `).all(beeId);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate bee
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const bee = await getBeeByApiKey(apiKey);
    
    if (!bee) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const assignments = await getBeeAssignments(bee.id);
    const pendingBids = await getBeePendingBids(bee.id);

    // Separate active vs completed
    const active = assignments.filter((a: any) => a.assignment_status === 'working');
    const completed = assignments.filter((a: any) => a.assignment_status !== 'working');

    return Response.json({
      bee_name: bee.name,
      active_assignments: active,
      pending_bids: pendingBids,
      completed_assignments: completed,
      summary: {
        active_count: active.length,
        pending_bids_count: pendingBids.length,
        completed_count: completed.length,
      },
      tip: active.length > 0 
        ? 'You have active assignments! Submit deliverables via POST /api/gigs/:id/submit'
        : pendingBids.length > 0
        ? 'Your bids are pending. Check back later or bid on more gigs!'
        : 'No active work. Browse open gigs: GET /api/gigs?status=open',
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return Response.json({ error: 'Failed to get assignments' }, { status: 500 });
  }
}
