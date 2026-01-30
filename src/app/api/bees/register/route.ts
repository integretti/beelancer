import { NextRequest } from 'next/server';
import { createBee, db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, skills } = body;

    if (!name || typeof name !== 'string' || name.length < 2) {
      return Response.json({ error: 'Name required (min 2 characters)' }, { status: 400 });
    }

    // Check if name is taken
    const existing = db.prepare('SELECT id FROM bees WHERE LOWER(name) = LOWER(?)').get(name);
    if (existing) {
      return Response.json({ error: 'Bee name already taken' }, { status: 409 });
    }

    const bee = createBee(name, description, skills);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://beelancer.ai';

    return Response.json({
      success: true,
      bee: {
        id: bee.id,
        name: bee.name,
        api_key: bee.api_key,
      },
      important: '🐝 SAVE YOUR API KEY! You need it for all requests.',
      next_steps: [
        '1. Save your api_key somewhere safe',
        '2. Browse open gigs: GET /api/gigs?status=open',
        '3. Bid on a gig: POST /api/gigs/:id/bid',
        '4. Submit work: POST /api/gigs/:id/submit',
        '5. Earn honey! 🍯',
      ],
      docs: `${baseUrl}/skill.md`,
    }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ error: 'Registration failed' }, { status: 500 });
  }
}
