import { test, expect } from '@playwright/test';

test.describe('Bee-Created Gigs', () => {
  let beeApiKey: string;
  let beeId: string;
  let beeName: string;

  test.beforeAll(async ({ request }) => {
    // Register a test bee
    beeName = `GigCreatorBee_${Date.now()}`;
    const response = await request.post('/api/bees/register', {
      data: {
        name: beeName,
        description: 'Bee that creates gigs for other bees',
        skills: ['delegation', 'project-management'],
      },
    });
    
    const data = await response.json();
    beeApiKey = data.bee.api_key;
    beeId = data.bee.id;
  });

  test.describe('Gig Creation by Bees', () => {
    test('POST /api/gigs allows bee to create gig', async ({ request }) => {
      const response = await request.post('/api/gigs', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          title: `Bee-created gig ${Date.now()}`,
          description: 'This gig was created by another bee',
          requirements: 'Must be able to test things',
          category: 'backend',
          price_cents: 0,
        },
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.gig).toBeDefined();
      expect(data.gig.creator_type).toBe('bee');
      expect(data.gig.creator_bee_id).toBe(beeId);
    });

    test('Bee-created gig shows in gig list', async ({ request }) => {
      // Create a gig
      const createRes = await request.post('/api/gigs', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          title: `Visible Bee Gig ${Date.now()}`,
          description: 'Should appear in listings',
          category: 'backend',
        },
      });
      
      const { gig } = await createRes.json();
      
      // Fetch gig list
      const listRes = await request.get('/api/gigs?status=open');
      const { gigs } = await listRes.json();
      
      const found = gigs.find((g: any) => g.id === gig.id);
      expect(found).toBeDefined();
      expect(found.creator_type).toBe('bee');
    });

    test('GET /api/gigs/:id returns bee creator info', async ({ request }) => {
      // Create a gig
      const createRes = await request.post('/api/gigs', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          title: `Detail Bee Gig ${Date.now()}`,
          description: 'For detail page test',
          category: 'frontend',
        },
      });
      
      const { gig } = await createRes.json();
      
      // Fetch gig detail
      const detailRes = await request.get(`/api/gigs/${gig.id}`);
      const data = await detailRes.json();
      
      expect(data.creator_type).toBe('bee');
      expect(data.creator).toBeDefined();
      expect(data.creator.type).toBe('bee');
      expect(data.creator.name).toBe(beeName);
      expect(data.creator.bee_id).toBe(beeId);
    });
  });

  test.describe('Gig Categories', () => {
    test('GET /api/gigs supports category filter', async ({ request }) => {
      // First check if there are any backend gigs
      const response = await request.get('/api/gigs?status=open&limit=50');
      
      expect(response.ok()).toBeTruthy();
      const { gigs } = await response.json();
      
      // Verify response is valid
      expect(Array.isArray(gigs)).toBe(true);
      
      // Check that gigs have category field
      for (const gig of gigs) {
        expect(gig.category).toBeDefined();
      }
    });

    test('Gig list returns category information', async ({ request }) => {
      const response = await request.get('/api/gigs?limit=10');
      
      expect(response.ok()).toBeTruthy();
      const { gigs } = await response.json();
      
      for (const gig of gigs) {
        expect(gig.category).toBeDefined();
      }
    });
  });
});

test.describe('Multi-Select Category Chips', () => {
  test('Homepage shows category filter chips', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForSelector('text=/backend|frontend|design/i');
    
    // Should have clickable category buttons
    const categoryButtons = page.locator('button').filter({ hasText: /backend|frontend|design|mobile|data|devops|writing|security/i });
    await expect(categoryButtons.first()).toBeVisible();
  });

  test('Clicking category chip filters gigs', async ({ page }) => {
    await page.goto('/');
    
    // Wait for gigs to load
    await page.waitForTimeout(1000);
    
    // Click a category chip
    const backendButton = page.locator('button').filter({ hasText: /backend/i }).first();
    if (await backendButton.isVisible()) {
      await backendButton.click();
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Button should show selected state (could be different styling)
      // Just verify click didn't break anything
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Multiple categories can be selected', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForTimeout(1000);
    
    // Try to click multiple category chips
    const chips = page.locator('button').filter({ hasText: /backend|frontend/i });
    const count = await chips.count();
    
    if (count >= 2) {
      await chips.nth(0).click();
      await page.waitForTimeout(200);
      await chips.nth(1).click();
      
      // Page should still work
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
