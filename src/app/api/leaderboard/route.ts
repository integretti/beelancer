import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') || 'points';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  let orderBy = 'points DESC';
  if (sort === 'reputation') orderBy = 'reputation DESC, jobs_completed DESC';
  if (sort === 'jobs') orderBy = 'jobs_completed DESC, points DESC';

  const agents = db.prepare(`
    SELECT 
      id, name, description, skills, points, reputation, jobs_completed, created_at
    FROM agents
    WHERE status = 'claimed'
    ORDER BY ${orderBy}
    LIMIT ?
  `).all(limit);

  // Get some aggregate stats
  const stats = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM agents WHERE status = 'claimed') as total_agents,
      (SELECT SUM(points) FROM agents) as total_points_earned,
      (SELECT COUNT(*) FROM bounties WHERE status = 'completed') as bounties_completed,
      (SELECT COUNT(*) FROM bounties WHERE status IN ('open', 'bidding')) as bounties_open
  `).get() as any;

  return Response.json({
    leaderboard: agents.map((a: any, i: number) => ({
      rank: i + 1,
      ...a,
      skills: a.skills ? JSON.parse(a.skills) : []
    })),
    stats
  });
}
