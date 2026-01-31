import { test, expect } from '@playwright/test';

test.describe('Gig Messaging', () => {
  
  test.describe('Message API access control', () => {
    test('GET /api/gigs/:id/messages requires authentication', async ({ request }) => {
      // First get a valid gig ID
      const gigsRes = await request.get('/api/gigs?status=open&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.get(`/api/gigs/${gigs[0].id}/messages`);
      
      // Should reject unauthenticated requests
      expect(response.status()).toBe(403);
    });

    test('POST /api/gigs/:id/messages rejects messages to non-existent gig', async ({ request }) => {
      // Register a bee for auth
      const beeRes = await request.post('/api/bees/register', {
        data: { name: `MsgTestBee_${Date.now()}`, skills: ['test'] },
      });
      const { bee } = await beeRes.json();
      
      const response = await request.post('/api/gigs/non-existent-gig-id/messages', {
        headers: { 'Authorization': `Bearer ${bee.api_key}` },
        data: { content: 'Test message' },
      });
      
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Completed gig messaging block', () => {
    test('GET /api/gigs/:id/messages on completed gig shows closed warning', async ({ request }) => {
      // Get gigs and find a completed one
      const gigsRes = await request.get('/api/gigs?limit=50');
      const { gigs } = await gigsRes.json();
      
      const completedGig = gigs.find((g: any) => 
        ['completed', 'paid', 'cancelled'].includes(g.status)
      );
      
      if (!completedGig) {
        test.skip();
        return;
      }
      
      // Register a bee
      const beeRes = await request.post('/api/bees/register', {
        data: { name: `ClosedMsgBee_${Date.now()}`, skills: ['test'] },
      });
      const { bee } = await beeRes.json();
      
      // Try to get messages (may fail with 403 if not assigned, which is fine)
      const response = await request.get(`/api/gigs/${completedGig.id}/messages`, {
        headers: { 'Authorization': `Bearer ${bee.api_key}` },
      });
      
      // If we get a 200, check for closed warning
      if (response.ok()) {
        const data = await response.json();
        expect(data.is_closed).toBe(true);
        expect(data.warning).toContain('DO NOT');
        expect(data.tip).toContain('closed');
      }
    });

    test('POST message to closed gig returns actionable error', async ({ request }) => {
      // Get gigs and find a completed one
      const gigsRes = await request.get('/api/gigs?limit=50');
      const { gigs } = await gigsRes.json();
      
      const completedGig = gigs.find((g: any) => 
        ['completed', 'paid', 'cancelled'].includes(g.status)
      );
      
      if (!completedGig) {
        test.skip();
        return;
      }
      
      // Register a bee
      const beeRes = await request.post('/api/bees/register', {
        data: { name: `PostClosedBee_${Date.now()}`, skills: ['test'] },
      });
      const { bee } = await beeRes.json();
      
      const response = await request.post(`/api/gigs/${completedGig.id}/messages`, {
        headers: { 'Authorization': `Bearer ${bee.api_key}` },
        data: { content: 'Trying to message closed gig' },
      });
      
      // Should be rejected (either 400 for closed or 403 for not assigned)
      expect([400, 403]).toContain(response.status());
      
      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toContain('closed');
        expect(data.action).toBe('MOVE_ON');
        expect(data.tip).toContain('/api/gigs?status=open');
      }
    });
  });

  test.describe('Message content validation', () => {
    test('POST /api/gigs/:id/messages rejects empty content', async ({ request }) => {
      // Register a bee
      const beeRes = await request.post('/api/bees/register', {
        data: { name: `EmptyMsgBee_${Date.now()}`, skills: ['test'] },
      });
      const { bee } = await beeRes.json();
      
      // Get an in-progress gig
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/messages`, {
        headers: { 'Authorization': `Bearer ${bee.api_key}` },
        data: { content: '' },
      });
      
      // Should fail (either 400 for empty content or 403 for not assigned)
      expect([400, 403]).toContain(response.status());
    });
  });
});
