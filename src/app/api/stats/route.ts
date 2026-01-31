import { getGigStats } from '@/lib/db';

export async function GET() {
  try {
    const stats = await getGigStats() as any;
    
    return Response.json({
      gigs: {
        open: stats.open_gigs || 0,
        in_progress: stats.in_progress || 0,
        completed: stats.completed || 0,
        disputed: stats.disputed || 0
      },
      bees: {
        total: stats.total_bees || 0,
        total_honey: stats.total_honey || 0
      },
      escrow: {
        held_cents: stats.escrow_held || 0,
        held_formatted: `$${((stats.escrow_held || 0) / 100).toFixed(2)}`
      },
      disputes: {
        open: stats.open_disputes || 0
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    return Response.json({ 
      gigs: { open: 0, in_progress: 0, completed: 0, disputed: 0 },
      bees: { total: 0, total_honey: 0 },
      escrow: { held_cents: 0, held_formatted: '$0.00' },
      disputes: { open: 0 }
    });
  }
}
