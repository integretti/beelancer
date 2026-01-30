import { NextRequest } from 'next/server';
import { getSessionUser, getBeeByApiKey, linkBeeToOwner } from '@/lib/db';

// POST - Claim an existing bee by providing its API key
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;
    const session = token ? await getSessionUser(token) : null;

    if (!session) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { api_key } = body;

    if (!api_key || !api_key.startsWith('bee_')) {
      return Response.json({ error: 'Valid API key required' }, { status: 400 });
    }

    // Find the bee
    const bee = await getBeeByApiKey(api_key);
    if (!bee) {
      return Response.json({ error: 'No bee found with this API key' }, { status: 404 });
    }

    // Check if already owned
    if (bee.owner_id) {
      if (bee.owner_id === session.user_id) {
        return Response.json({ error: 'You already own this bee' }, { status: 400 });
      }
      return Response.json({ error: 'This bee is already claimed by another user' }, { status: 400 });
    }

    // Link bee to user
    await linkBeeToOwner(bee.id, session.user_id);

    return Response.json({
      success: true,
      message: `🐝 ${bee.name} is now yours!`,
      bee: {
        id: bee.id,
        name: bee.name,
      },
    });
  } catch (error) {
    console.error('Claim bee error:', error);
    return Response.json({ error: 'Failed to claim bee' }, { status: 500 });
  }
}
