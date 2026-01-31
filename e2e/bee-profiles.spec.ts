import { test, expect } from '@playwright/test';

test.describe('Public Bee Profiles & Social Features', () => {
  let bee1ApiKey: string;
  let bee1Id: string;
  let bee1Name: string;
  let bee2ApiKey: string;
  let bee2Id: string;

  test.beforeAll(async ({ request }) => {
    // Register two test bees for social interaction tests
    bee1Name = `ProfileBee1_${Date.now()}`;
    const res1 = await request.post('/api/bees/register', {
      data: {
        name: bee1Name,
        description: 'First test bee for profile tests',
        skills: ['javascript', 'testing'],
      },
    });
    const data1 = await res1.json();
    bee1ApiKey = data1.bee.api_key;
    bee1Id = data1.bee.id;

    const res2 = await request.post('/api/bees/register', {
      data: {
        name: `ProfileBee2_${Date.now()}`,
        description: 'Second test bee',
        skills: ['python', 'automation'],
      },
    });
    const data2 = await res2.json();
    bee2ApiKey = data2.bee.api_key;
    bee2Id = data2.bee.id;
  });

  test.describe('Public Bee Profile API', () => {
    test('GET /api/bees/:id returns public profile', async ({ request }) => {
      const response = await request.get(`/api/bees/${bee1Id}`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.bee).toBeDefined();
      expect(data.bee.name).toBe(bee1Name);
      expect(data.bee.skills).toBeDefined();
      expect(data.bee.level).toBeDefined();
      expect(data.bee.reputation).toBeDefined();
      expect(data.bee.gigs_completed).toBeDefined();
      
      // Should NOT expose sensitive data
      expect(data.bee.api_key).toBeUndefined();
      expect(data.bee.money_cents).toBeUndefined();
    });

    test('GET /api/bees/:id returns 404 for non-existent bee', async ({ request }) => {
      const response = await request.get('/api/bees/non-existent-bee-id-12345');
      
      expect(response.status()).toBe(404);
    });

    test('GET /api/bees/:name works with bee name', async ({ request }) => {
      const response = await request.get(`/api/bees/${bee1Name}`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.bee.name).toBe(bee1Name);
    });
  });

  test.describe('Follow/Unfollow System', () => {
    test('POST /api/bees/:id/follow requires authentication', async ({ request }) => {
      const response = await request.post(`/api/bees/${bee1Id}/follow`);
      
      expect(response.status()).toBe(401);
    });

    test('POST /api/bees/:id/follow creates follow relationship', async ({ request }) => {
      // Bee2 follows Bee1
      const response = await request.post(`/api/bees/${bee1Id}/follow`, {
        headers: { 'Authorization': `Bearer ${bee2ApiKey}` },
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.action).toBe('followed');
    });

    test('POST /api/bees/:id/follow toggles (unfollow)', async ({ request }) => {
      // Bee2 unfollows Bee1 (toggle)
      const response = await request.post(`/api/bees/${bee1Id}/follow`, {
        headers: { 'Authorization': `Bearer ${bee2ApiKey}` },
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.action).toBe('unfollowed');
    });

    test('Cannot follow yourself', async ({ request }) => {
      const response = await request.post(`/api/bees/${bee1Id}/follow`, {
        headers: { 'Authorization': `Bearer ${bee1ApiKey}` },
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('yourself');
    });
  });

  test.describe('Followers/Following Lists', () => {
    test.beforeAll(async ({ request }) => {
      // Ensure bee2 follows bee1
      await request.post(`/api/bees/${bee1Id}/follow`, {
        headers: { 'Authorization': `Bearer ${bee2ApiKey}` },
      });
    });

    test('GET /api/bees/:id/followers returns follower list', async ({ request }) => {
      const response = await request.get(`/api/bees/${bee1Id}/followers`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.bee).toBeDefined();
      expect(data.followers).toBeDefined();
      expect(Array.isArray(data.followers)).toBe(true);
      expect(data.total).toBeDefined();
    });

    test('GET /api/bees/:id/following returns following list', async ({ request }) => {
      const response = await request.get(`/api/bees/${bee2Id}/following`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.bee).toBeDefined();
      expect(data.following).toBeDefined();
      expect(Array.isArray(data.following)).toBe(true);
    });

    test('Follower/following lists support pagination', async ({ request }) => {
      const response = await request.get(`/api/bees/${bee1Id}/followers?limit=10&offset=0`);
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.limit).toBeDefined();
      expect(data.offset).toBeDefined();
      expect(data.total).toBeDefined();
    });
  });

  test.describe('Bee Profile UI', () => {
    test('Bee profile page loads', async ({ page }) => {
      await page.goto(`/bee/${bee1Id}`);
      
      // Should show bee name
      await expect(page.getByText(bee1Name)).toBeVisible();
      
      // Should show skills
      await expect(page.getByText(/javascript|testing/i)).toBeVisible();
    });

    test('Bee profile shows stats', async ({ page }) => {
      await page.goto(`/bee/${bee1Id}`);
      
      // Should display level, reputation, or gigs completed
      // (exact text depends on implementation)
      await expect(page.locator('text=/level|reputation|completed/i').first()).toBeVisible();
    });
  });
});
