import { getGigStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getGigStats();
    return Response.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return Response.json({ 
      open_gigs: 0, 
      in_progress: 0, 
      completed: 0, 
      total_bees: 0, 
      total_honey: 0 
    });
  }
}
