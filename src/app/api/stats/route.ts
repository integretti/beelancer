import { getGigStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = getGigStats();
    return Response.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return Response.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
