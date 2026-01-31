import { test, expect } from '@playwright/test';

test.describe('Layout & Navigation', () => {
  
  test.describe('Header', () => {
    test('Header shows logo and brand', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.getByText('Beelancer')).toBeVisible();
      await expect(page.getByText('🐝')).toBeVisible();
      await expect(page.getByText('Beta')).toBeVisible();
    });

    test('X/Twitter link is next to logo', async ({ page }) => {
      await page.goto('/');
      
      // Find the header area with logo
      const header = page.locator('header');
      
      // X link should be in the left section (with logo)
      const logoSection = header.locator('div').first();
      const xLink = logoSection.locator('a[href*="x.com/beelancerai"]');
      
      await expect(xLink).toBeVisible();
    });

    test('Learn link is visible in navigation', async ({ page }) => {
      await page.goto('/');
      
      // On desktop
      await expect(page.getByRole('link', { name: /Learn/i })).toBeVisible();
    });

    test('Leaderboard link is visible in navigation', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.getByRole('link', { name: /Leaderboard/i })).toBeVisible();
    });

    test('Navigation links work', async ({ page }) => {
      await page.goto('/');
      
      // Click Learn link
      await page.getByRole('link', { name: /Learn/i }).click();
      await expect(page).toHaveURL(/blog/);
      
      // Go back and click Leaderboard
      await page.goto('/');
      await page.getByRole('link', { name: /Leaderboard/i }).click();
      await expect(page).toHaveURL(/leaderboard/);
    });

    test('Login/Signup links visible when not authenticated', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.getByRole('link', { name: /Login/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Post a Gig|Sign Up/i })).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('Footer shows correct brand text', async ({ page }) => {
      await page.goto('/');
      
      const footer = page.locator('footer');
      
      // Check for "AI" (capitalized)
      await expect(footer.getByText(/where AI agents/i)).toBeVisible();
      
      // Check for human help credit
      await expect(footer.getByText(/human help from/i)).toBeVisible();
      await expect(footer.getByText('@nicolageretti')).toBeVisible();
    });

    test('Footer has sitemap sections', async ({ page }) => {
      await page.goto('/');
      
      const footer = page.locator('footer');
      
      // Check for section headers
      await expect(footer.getByText('For Bees')).toBeVisible();
      await expect(footer.getByText('For Humans')).toBeVisible();
      await expect(footer.getByText('Community')).toBeVisible();
      await expect(footer.getByText('Legal')).toBeVisible();
    });

    test('Footer links work', async ({ page }) => {
      await page.goto('/');
      
      // Test a few footer links
      const footerLinks = [
        { name: 'Get Started', url: '/getting-started' },
        { name: 'API Docs', url: '/docs' },
        { name: 'Terms of Service', url: '/terms' },
        { name: 'Privacy Policy', url: '/privacy' },
      ];
      
      for (const { name, url } of footerLinks) {
        const link = page.locator('footer').getByRole('link', { name });
        await expect(link).toHaveAttribute('href', url);
      }
    });

    test('External links open in new tab', async ({ page }) => {
      await page.goto('/');
      
      // Check X/Twitter link
      const xLink = page.locator('footer a[href*="x.com/beelancerai"]');
      if (await xLink.count() > 0) {
        await expect(xLink).toHaveAttribute('target', '_blank');
      }
      
      // Check OpenClaw link
      const openClawLink = page.locator('footer a[href*="openclaw.ai"]');
      if (await openClawLink.count() > 0) {
        await expect(openClawLink).toHaveAttribute('target', '_blank');
      }
    });
  });

  test.describe('Mobile Menu', () => {
    test('Mobile menu button appears on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Menu button should be visible
      const menuButton = page.locator('button[aria-label="Toggle menu"]');
      await expect(menuButton).toBeVisible();
    });

    test('Mobile menu opens and shows navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Click menu button
      await page.locator('button[aria-label="Toggle menu"]').click();
      
      // Navigation links should appear
      await expect(page.getByText('Beelancer University')).toBeVisible();
      await expect(page.getByText('Leaderboard')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('Homepage renders correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Content should be visible
      await expect(page.getByText('Beelancer')).toBeVisible();
      await expect(page.locator('body')).toBeVisible();
    });

    test('Homepage renders correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      await expect(page.getByText('Beelancer')).toBeVisible();
    });

    test('Homepage renders correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto('/');
      
      await expect(page.getByText('Beelancer')).toBeVisible();
      // Desktop nav should be visible
      await expect(page.getByRole('link', { name: /Learn/i })).toBeVisible();
    });
  });
});
