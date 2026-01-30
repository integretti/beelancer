import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestName } from './helpers';

/**
 * Full Integration Tests
 * 
 * These tests cover complete user journeys from start to finish.
 * They test the actual user experience, not just individual components.
 */

test.describe('Full User Flows', () => {
  
  test.describe('New User Signup Flow', () => {
    test('complete signup → verify → dashboard flow', async ({ page, request, baseURL }) => {
      const email = generateTestEmail();
      const password = 'SecurePassword123!';
      const name = generateTestName();

      // Step 1: Visit homepage
      await page.goto('/');
      await expect(page.getByText('Beelancer')).toBeVisible();

      // Step 2: Click "Post a Gig" (should go to signup since not logged in)
      await page.click('a:has-text("Post a Gig")');
      await expect(page).toHaveURL(/\/signup/);

      // Step 3: Fill out signup form
      await page.fill('input[placeholder*="call you"]', name);
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      
      // Step 4: Submit signup
      await page.click('button[type="submit"]');
      
      // Step 5: Should see success message
      await expect(page.getByText(/check your inbox/i)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(email)).toBeVisible();

      // Step 6: Get verification code (via test endpoint)
      const codeResponse = await request.get(`/api/test/verification-code?email=${encodeURIComponent(email)}`);
      
      // If test endpoint is not available (production), skip the rest
      if (!codeResponse.ok()) {
        test.skip(true, 'Verification code endpoint not available');
        return;
      }
      
      const { code } = await codeResponse.json();
      expect(code).toBeDefined();

      // Step 7: Go to verify page
      await page.goto('/verify');
      
      // Step 8: Enter verification code
      await page.fill('input[type="text"]', code);
      await page.click('button[type="submit"]');

      // Step 9: Should be redirected to dashboard and logged in
      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
      
      // Step 10: Verify header shows logged-in state
      await page.goto('/');
      await page.waitForTimeout(1500); // Wait for auth check
      await expect(page.getByRole('button', { name: /logout/i })).toBeVisible();
    });
  });

  test.describe('Bee Registration Flow', () => {
    test('register bee → get API key → check profile', async ({ request }) => {
      const beeName = `FlowTestBee_${Date.now()}`;

      // Step 1: Register a new bee
      const registerRes = await request.post('/api/bees/register', {
        data: {
          name: beeName,
          description: 'An AI agent for flow testing',
          skills: ['testing', 'automation', 'analysis'],
        },
      });

      expect(registerRes.ok()).toBeTruthy();
      const registerData = await registerRes.json();
      
      expect(registerData.success).toBe(true);
      expect(registerData.bee.api_key).toMatch(/^bee_/);
      
      const apiKey = registerData.bee.api_key;

      // Step 2: Check profile with API key
      const profileRes = await request.get('/api/bees/me', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });

      expect(profileRes.ok()).toBeTruthy();
      const profileData = await profileRes.json();

      expect(profileData.bee.name).toBe(beeName);
      expect(profileData.bee.honey).toBe(0);
      expect(profileData.bee.gigs_completed).toBe(0);

      // Step 3: Verify bee appears in stats
      const statsRes = await request.get('/api/stats');
      const statsData = await statsRes.json();
      
      expect(statsData.total_bees).toBeGreaterThan(0);
    });
  });

  test.describe('Gig Discovery Flow', () => {
    test('browse gigs → view details → navigate', async ({ page }) => {
      // Step 1: Visit homepage
      await page.goto('/');

      // Step 2: Look at gigs section
      await expect(page.getByRole('heading', { name: /fresh gigs/i })).toBeVisible();

      // Step 3: Try category filter
      const categorySelect = page.getByRole('combobox');
      await expect(categorySelect).toBeVisible();
      
      // Step 4: Check API docs are accessible
      await page.click('a:has-text("API Docs")');
      await expect(page).toHaveURL(/\/docs/);
      
      // Step 5: Verify docs content
      await expect(page.getByRole('heading', { name: /api reference/i })).toBeVisible();
      await expect(page.getByText('/api/bees/register')).toBeVisible();
    });
  });

  test.describe('API Documentation Flow', () => {
    test('read docs → try endpoint examples', async ({ page, request }) => {
      // Step 1: Visit docs
      await page.goto('/docs');
      
      // Step 2: Read about bee registration
      const registerSection = page.getByText('/api/bees/register').first();
      await registerSection.click();
      
      // Step 3: Verify example is shown
      await expect(page.getByText(/unique name for your bee/i).first()).toBeVisible();
      
      // Step 4: Actually try the endpoint (from docs example)
      const beeName = `DocsTestBee_${Date.now()}`;
      const response = await request.post('/api/bees/register', {
        data: {
          name: beeName,
          skills: ['coding'],
        },
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.bee.api_key).toBeDefined();
    });
  });
});

test.describe('Edge Cases & Error Handling', () => {
  
  test('should handle rapid signup attempts gracefully', async ({ request }) => {
    const email = generateTestEmail();
    
    // Send multiple signup requests rapidly
    const promises = Array(3).fill(null).map(() => 
      request.post('/api/auth/signup', {
        data: {
          email,
          password: 'TestPassword123!',
          name: 'Rapid Test',
        },
      })
    );
    
    const responses = await Promise.all(promises);
    
    // First should succeed, others should fail with conflict
    const successCount = responses.filter(r => r.status() === 201).length;
    const conflictCount = responses.filter(r => r.status() === 409).length;
    
    expect(successCount).toBe(1);
    expect(conflictCount).toBe(2);
  });

  test('should handle invalid API keys gracefully', async ({ request }) => {
    const invalidKeys = [
      'invalid',
      'bee_invalid',
      '',
      'Bearer token',
      '🐝🐝🐝',
    ];

    for (const key of invalidKeys) {
      const response = await request.get('/api/bees/me', {
        headers: { 'Authorization': `Bearer ${key}` },
      });
      
      expect(response.status()).toBe(401);
    }
  });

  test('should handle malformed JSON gracefully', async ({ request }) => {
    const response = await request.post('/api/bees/register', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not valid json {{{',
    });
    
    // Should return 400 or 500, not crash
    expect([400, 500]).toContain(response.status());
  });
});
