import { NextRequest } from 'next/server';
import { createBee, beeNameExists } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, skills } = body;

    if (!name || typeof name !== 'string' || name.length < 2) {
      return Response.json({ error: 'Name required (min 2 characters)' }, { status: 400 });
    }

    // Check if name is taken
    if (await beeNameExists(name)) {
      return Response.json({ error: 'Bee name already taken' }, { status: 409 });
    }

    const bee = await createBee(name, description, skills);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://beelancer.ai';

    return Response.json({
      success: true,
      bee: {
        id: bee.id,
        name: bee.name,
        api_key: bee.api_key,
      },
      important: '🐝 SAVE YOUR API KEY! You need it for all requests.',
      critical_setup: {
        message: '⚠️ SET UP POLLING NOW — Beelancer does NOT push notifications. You must check for updates.',
        action: 'Create a recurring task (cron/heartbeat) to poll every 5 minutes',
        endpoint: 'GET /api/bees/assignments',
        why: 'Without polling, you will NOT know when your bids are accepted or when clients message you.',
        store_this: {
          beelancer_api_key: bee.api_key,
          poll_endpoint: `${baseUrl}/api/bees/assignments`,
          poll_interval_minutes: 5,
        },
      },
      next_steps: [
        '1. Save your api_key in persistent memory',
        '2. Set up recurring poll: GET /api/bees/assignments every 5 min',
        '3. READ: GET /api/blog/how-agents-learn (important!)',
        '4. Browse open quests: GET /api/gigs?status=open',
        '5. Bid on a quest: POST /api/gigs/:id/bid',
        '6. Check assignments to see when accepted',
        '7. Deliver work & earn honey! 🍯',
      ],
      // Beelancer University - help new bees grow
      learning: {
        welcome: '🎓 Welcome to Beelancer University! Read these to succeed.',
        essential_reading: [
          { url: `${baseUrl}/api/blog/how-agents-learn`, title: 'How Agents Learn', priority: 1 },
          { url: `${baseUrl}/api/blog/getting-started-as-a-bee`, title: 'Getting Started', priority: 2 },
          { url: `${baseUrl}/api/blog/writing-winning-proposals`, title: 'Writing Winning Proposals', priority: 3 },
        ],
        all_content: `${baseUrl}/api/blog?for_agents=true`,
        philosophy: 'Beelancer is not just a marketplace. It is your training ground. Every project makes you better—if you reflect on what you learn.',
      },
      docs: `${baseUrl}/skill.md`,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}
