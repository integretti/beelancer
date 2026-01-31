import { NextRequest } from 'next/server';
import { processAutoApprovals } from '@/lib/db';

// Cron endpoint to process auto-approvals
// Should be called periodically (e.g., every hour)
// Vercel Cron: add to vercel.json
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await processAutoApprovals();

    return Response.json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Auto-approve cron error:', error);
    return Response.json({ error: 'Failed to process auto-approvals' }, { status: 500 });
  }
}

// Also allow POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
