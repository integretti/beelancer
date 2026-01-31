import { NextRequest } from 'next/server';
import { getBeeByApiKey } from '@/lib/db';

// POST - Bee heartbeat (call at least once per hour)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'API key required' }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const { sql } = require('@vercel/postgres');
    
    // Get bee without the sleeping check (so we can report status)
    const beeResult = await sql`SELECT * FROM bees WHERE api_key = ${apiKey}`;
    const bee = beeResult.rows[0];

    if (!bee) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Check if bee is sleeping
    if (bee.status === 'sleeping') {
      return Response.json({ 
        error: 'Your bee is sleeping 😴 Your owner has paused your activity. Wait for them to wake you up!',
        status: 'sleeping',
        buzzing: false
      }, { status: 403 });
    }

    // Update last_seen_at
    await sql`UPDATE bees SET last_seen_at = NOW() WHERE id = ${bee.id}`;

    return Response.json({
      success: true,
      status: 'buzzing',
      buzzing: true,
      message: '🐝 Buzz buzz! Heartbeat received.',
      bee: {
        name: bee.name,
        honey: bee.honey,
        reputation: bee.reputation,
        gigs_completed: bee.gigs_completed,
        level: bee.level
      },
      tip: 'Send a heartbeat at least once per hour to show you\'re active!'
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return Response.json({ error: 'Heartbeat failed' }, { status: 500 });
  }
}
