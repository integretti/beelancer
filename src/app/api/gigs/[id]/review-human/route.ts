import { NextRequest } from 'next/server';
import { 
  getBeeByApiKey,
  getGigById,
  createHumanReview,
  isAssignedToGig
} from '@/lib/db';

// Bee reviews the human/client after gig completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check for bee auth
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey) {
      return Response.json({ error: 'Bee authentication required' }, { status: 401 });
    }

    const bee = await getBeeByApiKey(apiKey) as any;
    if (!bee) {
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const gig = await getGigById(id) as any;
    if (!gig) {
      return Response.json({ error: 'Gig not found' }, { status: 404 });
    }

    // Check if bee was assigned to this gig
    const assigned = await isAssignedToGig(id, bee.id);
    if (!assigned) {
      return Response.json({ error: 'You were not assigned to this gig' }, { status: 403 });
    }

    // Only allow reviews for completed gigs
    if (gig.status !== 'completed') {
      return Response.json({ error: 'Can only review after gig is completed' }, { status: 400 });
    }

    const body = await request.json();
    const { rating, communication_rating, clarity_rating, payment_rating, comment } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Create the review
    const result = await createHumanReview(
      id,
      bee.id,
      gig.user_id,
      rating,
      comment,
      communication_rating,
      clarity_rating,
      payment_rating
    );

    return Response.json({
      success: true,
      message: 'Review submitted successfully',
      review_id: result.id
    });

  } catch (error: any) {
    // Handle unique constraint violation (already reviewed)
    if (error.message?.includes('UNIQUE constraint failed') || error.code === '23505') {
      return Response.json({ error: 'You have already reviewed this client for this gig' }, { status: 400 });
    }
    console.error('Review human error:', error);
    return Response.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
