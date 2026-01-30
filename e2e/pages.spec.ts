import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
  
  test.describe('Homepage', () => {
    test('should load and display key elements', async ({ page }) => {
      await page.goto('/');
      
      // Header
      await expect(page.getByText('Beelancer')).toBeVisible();
      
      // Hero section
      await expect(page.getByRole('heading', { name: /gig economy.*ai agents/i })).toBeVisible();
      await expect(page.getByText(/bees buzz in.*bid on gigs/i)).toBeVisible();
      
      // Bot registration section
      await expect(page.getByText(/send your ai agent/i)).toBeVisible();
      await expect(page.getByText(/skill\.md/i)).toBeVisible();
      
      // API docs link
      await expect(page.getByRole('link', { name: /api docs/i })).toBeVisible();
    });

    test('should display stats section', async ({ page }) => {
      await page.goto('/');
      
      // Stats should be visible (numbers may vary)
      await expect(page.getByText(/bees buzzing/i)).toBeVisible();
      await expect(page.getByText(/open gigs/i)).toBeVisible();
      await expect(page.getByText(/delivered/i)).toBeVisible();
    });

    test('should display gigs section', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.getByRole('heading', { name: /fresh gigs/i })).toBeVisible();
      
      // Category dropdown
      await expect(page.getByRole('combobox')).toBeVisible();
    });

    test('should have working navigation', async ({ page }) => {
      await page.goto('/');
      
      // Click API docs link
      await page.click('a:has-text("API Docs")');
      await expect(page).toHaveURL(/\/docs/);
      
      // Go back and click Post a Gig
      await page.goto('/');
      await page.click('a:has-text("Post a Gig")');
      await expect(page).toHaveURL(/\/(signup|dashboard)/);
    });
  });

  test.describe('API Docs Page', () => {
    test('should load and display documentation', async ({ page }) => {
      await page.goto('/docs');
      
      await expect(page.getByRole('heading', { name: /api reference/i })).toBeVisible();
      
      // Base URL section
      await expect(page.getByText(/beelancer\.ai\/api/)).toBeVisible();
      
      // Authentication section
      await expect(page.getByText(/authorization/i)).toBeVisible();
      
      // Quick start section
      await expect(page.getByRole('heading', { name: /quick start/i })).toBeVisible();
    });

    test('should have expandable endpoint cards', async ({ page }) => {
      await page.goto('/docs');
      
      // Find a POST endpoint card
      const registerEndpoint = page.getByText('/api/bees/register').first();
      await expect(registerEndpoint).toBeVisible();
      
      // Click to expand
      await registerEndpoint.click();
      
      // Should show details
      await expect(page.getByText(/unique name for your bee/i).first()).toBeVisible();
    });

    test('should display response codes table', async ({ page }) => {
      await page.goto('/docs');
      
      await expect(page.getByRole('heading', { name: /response codes/i })).toBeVisible();
      await expect(page.getByText('200')).toBeVisible();
      await expect(page.getByText('401')).toBeVisible();
      await expect(page.getByText('404')).toBeVisible();
    });
  });

  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
      await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
      await expect(page.getByPlaceholder(/your password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    });

    test('should have link to signup', async ({ page }) => {
      await page.goto('/login');
      
      await page.click('a:has-text("Create an account")');
      await expect(page).toHaveURL(/\/signup/);
    });
  });

  test.describe('Signup Page', () => {
    test('should display signup form', async ({ page }) => {
      await page.goto('/signup');
      
      await expect(page.getByRole('heading', { name: /join the hive/i })).toBeVisible();
      await expect(page.getByPlaceholder(/what should we call you/i)).toBeVisible();
      await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
      await expect(page.getByPlaceholder(/min 8 characters/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('should have link to login', async ({ page }) => {
      await page.goto('/signup');
      
      await page.click('a:has-text("Log in")');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Verify Page', () => {
    test('should display verification form', async ({ page }) => {
      await page.goto('/verify');
      
      await expect(page.getByRole('heading', { name: /enter your code/i })).toBeVisible();
      await expect(page.getByPlaceholder(/enter code/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /verify/i })).toBeVisible();
    });
  });

  test.describe('Skill.md Route', () => {
    test('should return markdown content', async ({ request }) => {
      const response = await request.get('/skill.md');
      
      expect(response.ok()).toBeTruthy();
      expect(response.headers()['content-type']).toContain('text/markdown');
      
      const content = await response.text();
      expect(content).toContain('Beelancer');
      expect(content).toContain('API');
    });
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 for non-existent pages gracefully', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist-12345');
    
    // Next.js returns 404
    expect(response?.status()).toBe(404);
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    // Logo should still be visible
    await expect(page.getByText('Beelancer').first()).toBeVisible();
    
    // Hero should be visible
    await expect(page.getByRole('heading', { name: /gig economy/i })).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    
    await expect(page.getByText('Beelancer').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /gig economy/i })).toBeVisible();
  });
});
