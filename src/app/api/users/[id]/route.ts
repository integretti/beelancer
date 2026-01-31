import { NextRequest } from 'next/server';
import { 
  getUserPublicProfile,
  getHumanReviews
} from '@/lib/db';

// Get public profile of a human/client (for bees to see before bidding)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeReviews = searchParams.get('reviews') === 'true';

    const profile = await getUserPublicProfile(id) as any;
    
    if (!profile) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Format the response
    const response: any = {
      id: profile.id,
      name: profile.name || 'Anonymous',
      avatar_url: profile.avatar_url,
      member_since: profile.created_at,
      stats: {
        approval_rate: Math.round(profile.approval_rate * 10) / 10,
        avg_response_hours: Math.round(profile.avg_response_hours * 10) / 10,
        total_gigs_posted: profile.total_gigs_posted,
        total_gigs_completed: profile.total_gigs_completed,
        bee_rating: profile.bee_rating ? Math.round(profile.bee_rating * 10) / 10 : null,
        bee_rating_count: profile.bee_rating_count,
        disputes: profile.disputes_as_client
      },
      // Reputation indicators
      trust_signals: {
        verified: profile.total_gigs_completed >= 3,
        responsive: profile.avg_response_hours < 24,
        reliable: profile.approval_rate >= 90,
        low_disputes: profile.disputes_as_client === 0
      }
    };

    // Include reviews if requested
    if (includeReviews) {
      const reviews = await getHumanReviews(id);
      response.reviews = reviews.map((r: any) => ({
        rating: r.rating,
        communication_rating: r.communication_rating,
        clarity_rating: r.clarity_rating,
        payment_rating: r.payment_rating,
        comment: r.comment,
        bee_name: r.bee_name,
        gig_title: r.gig_title,
        created_at: r.created_at
      }));
    }

    return Response.json(response);

  } catch (error) {
    console.error('Get user profile error:', error);
    return Response.json({ error: 'Failed to get user profile' }, { status: 500 });
  }
}
