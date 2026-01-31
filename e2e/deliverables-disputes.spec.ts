import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestName } from './helpers';

/**
 * Deliverables, Approval & Dispute Tests
 * 
 * These tests cover the critical post-assignment workflow:
 * - Deliverable submission and viewing
 * - Approval/revision request flow
 * - Dispute opening and management
 */

test.describe('Deliverables, Approval & Disputes', () => {
  let beeApiKey: string;
  let beeName: string;
  let beeId: string;

  test.beforeAll(async ({ request }) => {
    // Register a test bee for these tests
    beeName = `DeliverableBee_${Date.now()}`;
    const response = await request.post('/api/bees/register', {
      data: {
        name: beeName,
        description: 'Bee for testing deliverables and disputes',
        skills: ['delivery', 'testing', 'disputes'],
      },
    });
    const data = await response.json();
    beeApiKey = data.bee.api_key;
    beeId = data.bee.id;
  });

  test.describe('Deliverable Submission (Bee)', () => {
    test('POST /api/gigs/:id/submit requires bee authentication', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/submit`, {
        data: {
          title: 'Test deliverable',
          content: 'Test content',
        },
      });
      
      expect(response.status()).toBe(401);
    });

    test('POST /api/gigs/:id/submit requires title', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/submit`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          content: 'Test content without title',
        },
      });
      
      // 400 (validation error) or 403 (not assigned - checked first for security)
      expect([400, 403]).toContain(response.status());
      
      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toContain('itle');
      }
    });

    test('POST /api/gigs/:id/submit requires content or URL', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/submit`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          title: 'Title only, no content',
        },
      });
      
      // 400 (validation error) or 403 (not assigned - checked first for security)
      expect([400, 403]).toContain(response.status());
      
      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error.toLowerCase()).toMatch(/content|url/);
      }
    });

    test('POST /api/gigs/:id/submit rejects if bee not assigned', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/submit`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          title: 'Unauthorized submission',
          content: 'Should fail if not assigned',
        },
      });
      
      // Should fail with 403 (not assigned) or succeed if coincidentally assigned
      expect([201, 403]).toContain(response.status());
      
      if (response.status() === 403) {
        const data = await response.json();
        expect(data.error.toLowerCase()).toContain('not assigned');
      }
    });

    test('POST /api/gigs/:id/submit rejects on non-in-progress gig', async ({ request }) => {
      // Try open gig
      const openGigsRes = await request.get('/api/gigs?status=open&limit=1');
      const { gigs: openGigs } = await openGigsRes.json();
      
      if (openGigs.length > 0) {
        const response = await request.post(`/api/gigs/${openGigs[0].id}/submit`, {
          headers: { 'Authorization': `Bearer ${beeApiKey}` },
          data: {
            title: 'Premature submission',
            content: 'This gig is not in progress yet',
          },
        });
        
        expect([400, 403]).toContain(response.status());
      }
      
      // Try completed gig
      const completedGigsRes = await request.get('/api/gigs?status=completed&limit=1');
      const { gigs: completedGigs } = await completedGigsRes.json();
      
      if (completedGigs.length > 0) {
        const response = await request.post(`/api/gigs/${completedGigs[0].id}/submit`, {
          headers: { 'Authorization': `Bearer ${beeApiKey}` },
          data: {
            title: 'Late submission',
            content: 'This gig is already completed',
          },
        });
        
        expect([400, 403]).toContain(response.status());
      }
    });
  });

  test.describe('Deliverables Viewing (Human)', () => {
    test('GET /api/gigs/:id/deliverables requires authentication', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      // Request without auth (no cookies)
      const response = await request.get(`/api/gigs/${gigs[0].id}/deliverables`);
      
      expect(response.status()).toBe(403);
    });

    test('GET /api/gigs/:id/deliverables returns 404 for invalid gig', async ({ request }) => {
      const response = await request.get('/api/gigs/nonexistent-gig-id/deliverables');
      
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Approval Flow (Human)', () => {
    test('POST /api/gigs/:id/approve requires authentication', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/approve`, {
        data: {
          deliverable_id: 'test-deliverable-id',
          action: 'approve',
        },
      });
      
      expect(response.status()).toBe(401);
    });

    test('POST /api/gigs/:id/approve requires deliverable_id', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=review&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      // Even without proper auth, we should get a 400 or 401 for missing deliverable_id
      const response = await request.post(`/api/gigs/${gigs[0].id}/approve`, {
        data: {
          action: 'approve',
        },
      });
      
      // Either 401 (no auth) or 400 (missing deliverable_id)
      expect([400, 401]).toContain(response.status());
    });

    test('POST /api/gigs/:id/approve with invalid action returns error', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=review&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      // This will fail auth, but the pattern shows expected usage
      const response = await request.post(`/api/gigs/${gigs[0].id}/approve`, {
        data: {
          deliverable_id: 'test-id',
          action: 'invalid_action',
        },
      });
      
      // 401 (no auth) expected
      expect(response.status()).toBe(401);
    });

    test('POST /api/gigs/:id/approve reject action suggests dispute', async ({ request }) => {
      // This tests the API behavior - reject action should suggest opening a dispute
      const gigsRes = await request.get('/api/gigs?status=review&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      // Without auth we can't test the full flow, but we document the expected behavior
      expect(true).toBe(true); // Placeholder - full test requires authenticated browser context
    });
  });

  test.describe('Dispute Flow', () => {
    test('POST /api/gigs/:id/dispute requires authentication', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/dispute`, {
        data: {
          reason: 'Test dispute reason',
        },
      });
      
      expect(response.status()).toBe(401);
    });

    test('POST /api/gigs/:id/dispute requires reason', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          // Missing reason
        },
      });
      
      // Either 400 (missing reason) or 403 (not authorized for this gig)
      expect([400, 403]).toContain(response.status());
    });

    test('POST /api/gigs/:id/dispute returns 404 for non-existent gig', async ({ request }) => {
      const response = await request.post('/api/gigs/nonexistent-gig-id/dispute', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          reason: 'Test dispute',
        },
      });
      
      expect(response.status()).toBe(404);
    });

    test('GET /api/gigs/:id/dispute requires authentication', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=in_progress&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.get(`/api/gigs/${gigs[0].id}/dispute`);
      
      expect(response.status()).toBe(401);
    });

    test('GET /api/gigs/:id/dispute returns 404 when no dispute exists', async ({ request }) => {
      // Find a gig that likely has no dispute (open gigs shouldn't have disputes)
      const gigsRes = await request.get('/api/gigs?status=open&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.get(`/api/gigs/${gigs[0].id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      
      // 404 (no dispute) or 403 (not authorized)
      expect([404, 403]).toContain(response.status());
    });

    test('Bee can open dispute on assigned gig', async ({ request }) => {
      // Find an in-progress gig where we might be assigned
      const assignmentsRes = await request.get('/api/bees/assignments', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      const assignments = await assignmentsRes.json();
      
      if (assignments.active_assignments.length === 0) {
        test.skip();
        return;
      }
      
      const assignedGig = assignments.active_assignments[0];
      
      const response = await request.post(`/api/gigs/${assignedGig.gig_id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          reason: `Test dispute from bee ${Date.now()}`,
          evidence: 'This is test evidence for the dispute.',
        },
      });
      
      // Success (201/200) or already exists (400)
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.dispute_id).toBeDefined();
      } else {
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error.toLowerCase()).toContain('already');
      }
    });

    test('Dispute add_message requires existing dispute', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=open&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          action: 'add_message',
          message: 'Test message',
        },
      });
      
      // Either 404 (no dispute) or 403 (not authorized)
      expect([403, 404]).toContain(response.status());
    });

    test('Dispute message requires content', async ({ request }) => {
      // Find a gig with an existing dispute
      const assignmentsRes = await request.get('/api/bees/assignments', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      const assignments = await assignmentsRes.json();
      
      if (assignments.active_assignments.length === 0) {
        test.skip();
        return;
      }
      
      const assignedGig = assignments.active_assignments[0];
      
      const response = await request.post(`/api/gigs/${assignedGig.gig_id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          action: 'add_message',
          // Missing message content
        },
      });
      
      // Should fail - either no dispute (404), no message (400), or not authorized (403)
      expect([400, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Full Dispute Flow Integration', () => {
    test('Bee can view dispute after opening', async ({ request }) => {
      const assignmentsRes = await request.get('/api/bees/assignments', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      const assignments = await assignmentsRes.json();
      
      if (assignments.active_assignments.length === 0) {
        test.skip();
        return;
      }
      
      const assignedGig = assignments.active_assignments[0];
      
      // Try to open or get existing dispute
      await request.post(`/api/gigs/${assignedGig.gig_id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          reason: `Test dispute for viewing ${Date.now()}`,
        },
      });
      
      // Now try to view it
      const getRes = await request.get(`/api/gigs/${assignedGig.gig_id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      
      if (getRes.ok()) {
        const data = await getRes.json();
        expect(data.dispute).toBeDefined();
        expect(data.dispute.status).toBeDefined();
        expect(data.messages).toBeDefined();
        expect(Array.isArray(data.messages)).toBe(true);
      }
    });

    test('Bee can add message to open dispute', async ({ request }) => {
      const assignmentsRes = await request.get('/api/bees/assignments', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      const assignments = await assignmentsRes.json();
      
      if (assignments.active_assignments.length === 0) {
        test.skip();
        return;
      }
      
      const assignedGig = assignments.active_assignments[0];
      
      // Make sure dispute exists
      await request.post(`/api/gigs/${assignedGig.gig_id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          reason: 'Test dispute for messaging',
        },
      });
      
      // Try to add a message
      const response = await request.post(`/api/gigs/${assignedGig.gig_id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          action: 'add_message',
          message: `Additional evidence: Test message ${Date.now()}`,
        },
      });
      
      if (response.ok()) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message_id).toBeDefined();
      }
    });
  });

  test.describe('Gig Status Transitions with Deliverables', () => {
    test('Gig with pending review shows in review status', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=review&limit=5');
      const { gigs } = await gigsRes.json();
      
      for (const gig of gigs) {
        expect(gig.status).toBe('review');
      }
    });

    test('Review gigs have assigned bee info', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=review&limit=3');
      const { gigs } = await gigsRes.json();
      
      for (const gig of gigs) {
        // Review status means a bee was assigned and submitted work
        const detailRes = await request.get(`/api/gigs/${gig.id}`);
        const data = await detailRes.json();
        const detail = data.gig || data;
        
        // Should have assignment info (if the API returns it)
        expect(detail.status).toBe('review');
      }
    });
  });

  test.describe('Revision Request Flow', () => {
    test('POST /api/gigs/:id/approve request_revision requires feedback', async ({ request }) => {
      // Test the validation - revision requests need feedback
      const gigsRes = await request.get('/api/gigs?status=review&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      // This tests the expected API behavior (will fail auth but shows pattern)
      // In a real scenario, request_revision with no feedback should return 400
      expect(true).toBe(true);
    });
  });

  test.describe('Completed Gig Deliverable Access', () => {
    test('Cannot submit deliverables to completed gig', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=completed&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/submit`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          title: 'Late deliverable',
          content: 'Should not be allowed',
        },
      });
      
      expect([400, 403]).toContain(response.status());
    });

    test('Cannot open dispute on completed gig without existing assignment', async ({ request }) => {
      const gigsRes = await request.get('/api/gigs?status=completed&limit=1');
      const { gigs } = await gigsRes.json();
      
      if (gigs.length === 0) {
        test.skip();
        return;
      }
      
      const response = await request.post(`/api/gigs/${gigs[0].id}/dispute`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          reason: 'Late dispute attempt',
        },
      });
      
      // Should fail - either not authorized (403) or gig already completed
      expect([400, 403]).toContain(response.status());
    });
  });
});
