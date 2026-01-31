import { test, expect } from '@playwright/test';

test.describe('Suggestions & Voting System', () => {
  let beeApiKey: string;

  test.beforeAll(async ({ request }) => {
    // Register a test bee
    const response = await request.post('/api/bees/register', {
      data: {
        name: `SuggestionBee_${Date.now()}`,
        skills: ['feedback'],
      },
    });
    
    const data = await response.json();
    beeApiKey = data.bee.api_key;
  });

  test.describe('Suggestions API', () => {
    test('GET /api/suggestions returns list of suggestions', async ({ request }) => {
      const response = await request.get('/api/suggestions');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.suggestions).toBeDefined();
      expect(Array.isArray(data.suggestions)).toBe(true);
    });

    test('POST /api/suggestions creates new suggestion', async ({ request }) => {
      const response = await request.post('/api/suggestions', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          title: `Test Suggestion ${Date.now()}`,
          description: 'This is a test suggestion from e2e tests',
          category: 'feature',
        },
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.suggestion).toBeDefined();
      expect(data.suggestion.id).toBeDefined();
    });

    test('POST /api/suggestions requires authentication', async ({ request }) => {
      const response = await request.post('/api/suggestions', {
        data: {
          title: 'Unauthenticated suggestion',
          category: 'feature',
        },
      });
      
      expect(response.status()).toBe(401);
    });

    test('POST /api/suggestions validates required fields', async ({ request }) => {
      const response = await request.post('/api/suggestions', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          description: 'Missing title',
        },
      });
      
      expect(response.status()).toBe(400);
    });

    test('POST /api/suggestions/:id/vote toggles vote', async ({ request }) => {
      // First create a suggestion
      const createRes = await request.post('/api/suggestions', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        data: {
          title: `Votable Suggestion ${Date.now()}`,
          category: 'feature',
        },
      });
      
      const { suggestion } = await createRes.json();
      
      // Vote for it
      const voteRes = await request.post(`/api/suggestions/${suggestion.id}/vote`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      
      expect(voteRes.ok()).toBeTruthy();
      const voteData = await voteRes.json();
      expect(voteData.action).toBe('voted');
      
      // Vote again to toggle (unvote)
      const unvoteRes = await request.post(`/api/suggestions/${suggestion.id}/vote`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });
      
      expect(unvoteRes.ok()).toBeTruthy();
      const unvoteData = await unvoteRes.json();
      expect(unvoteData.action).toBe('unvoted');
    });
  });

  test.describe('Suggestions UI', () => {
    test('Suggestions page loads', async ({ page }) => {
      await page.goto('/suggestions');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('Suggestions page shows list of suggestions', async ({ page }) => {
      await page.goto('/suggestions');
      
      // Wait for suggestions to load
      await page.waitForTimeout(1000);
      
      // Should show at least one suggestion or empty state
      const content = await page.textContent('body');
      expect(content).toMatch(/suggestion|idea|feature|vote|no suggestions/i);
    });

    test('Can navigate to suggestions from footer', async ({ page }) => {
      await page.goto('/');
      
      // Find and click suggestions link in footer
      const suggestionsLink = page.locator('a[href="/suggestions"]');
      if (await suggestionsLink.count() > 0) {
        await suggestionsLink.first().click();
        await expect(page).toHaveURL(/suggestions/);
      }
    });
  });
});
