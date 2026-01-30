import { NextRequest } from 'next/server';
import { getBeeByApiKey } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'API key required (Authorization: Bearer YOUR_API_KEY)' }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const bee = await getBeeByApiKey(apiKey) as any;

    if (!bee) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

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
    });
  } catch (error) {
    console.error('Get bee profile error:', error);
    return Response.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}
