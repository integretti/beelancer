import { test, expect } from '@playwright/test';

test.describe('Bee Assignments & Polling', () => {
  let beeApiKey: string;
  let beeName: string;

  test.beforeAll(async ({ request }) => {
    // Register a test bee
    beeName = `AssignmentTestBee_${Date.now()}`;
    const response = await request.post('/api/bees/register', {
      data: {
        name: beeName,
        description: 'Test bee for assignment tests',
        skills: ['testing', 'automation'],
      },
    });
    
    const data = await response.json();
    beeApiKey = data.bee.api_key;
  });

  test.describe('Assignments API', () => {
    test('GET /api/bees/assignments requires authentication', async ({ request }) => {
      const response = await request.get('/api/bees/assignments');
      
      expect(response.status()).toBe(401);
    });

    test('GET /api/bees/assignments returns structured response', async ({ request }) => {
      const response = await request.get('/api/bees/assignments', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.bee_name).toBe(beeName);
      expect(data.active_assignments).toBeDefined();
      expect(data.pending_bids).toBeDefined();
      expect(data.completed_assignments).toBeDefined();
      expect(data.summary).toBeDefined();
      expect(data.action_required).toBeDefined();
      expect(data.urgency).toBeDefined();
      expect(data.polling).toBeDefined();
    });

    test('Idle bee gets 30 minute polling recommendation', async ({ request }) => {
      const response = await request.get('/api/bees/assignments', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      
      const data = await response.json();
      
      // Bee with no active work should get IDLE action
      expect(data.action_required.type).toBe('IDLE');
      expect(data.action_required.message).toContain('30 minutes');
      expect(data.polling.next_check_minutes).toBe(30);
      expect(data.urgency).toBe('low');
    });

    test('Completed assignments have closed flag and warning', async ({ request }) => {
      const response = await request.get('/api/bees/assignments', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      
      const data = await response.json();
      
      // If there are completed assignments, they should have the warning
      for (const assignment of data.completed_assignments) {
        expect(assignment.closed).toBe(true);
        expect(assignment.action_required).toBe('NONE');
        expect(assignment._warning).toContain('DO NOT');
        expect(assignment._warning).toContain('CLOSED');
      }
    });

    test('Polling reminder is always present', async ({ request }) => {
      const response = await request.get('/api/bees/assignments', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      
      const data = await response.json();
      
      expect(data.polling.reminder).toContain('Beelancer does NOT push notifications');
      expect(data.polling.endpoint).toBe('/api/bees/assignments');
    });
  });

  test.describe('Learning resources in bee endpoints', () => {
    test('GET /api/bees/me includes learning section', async ({ request }) => {
      const response = await request.get('/api/bees/me', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.learning).toBeDefined();
      expect(data.learning.message).toContain('university');
      expect(data.learning.start_here).toContain('/api/blog/');
      expect(data.learning.all_content).toContain('for_agents=true');
      expect(data.learning.recommended).toBeDefined();
      expect(Array.isArray(data.learning.recommended)).toBe(true);
    });

    test('POST /api/bees/register response includes learning resources', async ({ request }) => {
      const response = await request.post('/api/bees/register', {
        data: {
          name: `LearningTestBee_${Date.now()}`,
          skills: ['test'],
        },
      });
      
      const data = await response.json();
      
      expect(data.learning).toBeDefined();
      expect(data.learning.welcome).toContain('University');
      expect(data.learning.essential_reading).toBeDefined();
      expect(Array.isArray(data.learning.essential_reading)).toBe(true);
      expect(data.learning.essential_reading.length).toBeGreaterThan(0);
    });
  });
});
