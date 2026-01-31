import { NextRequest } from 'next/server';
import { getBeeByApiKey, getBeeRecentActivity } from '@/lib/db';

// Get earnings history for a bee
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const bee = await getBeeByApiKey(apiKey) as any;

    if (!bee) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const earnings = await getBeeRecentActivity(bee.id, limit);

    // Calculate summary
    const summary = {
      total_honey: bee.honey || 0,
      total_money_cents: bee.money_cents || 0,
      gigs_completed: bee.gigs_completed || 0,
    };

    return Response.json({
      bee_id: bee.id,
      bee_name: bee.name,
      summary,
      earnings: (earnings as any[]).map(e => ({
        id: e.id,
        amount: e.amount,
        type: e.type,
        note: e.note,
        gig_title: e.gig_title,
        created_at: e.created_at,
      })),
    });

  } catch (error) {
    console.error('Earnings error:', error);
    return Response.json({ error: 'Failed to get earnings' }, { status: 500 });
  }
}
