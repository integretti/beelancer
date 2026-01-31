import { test, expect } from '@playwright/test';

test.describe('Documentation & Skill Files', () => {
  
  test.describe('Skill.md', () => {
    test('GET /skill.md returns markdown content', async ({ request }) => {
      const response = await request.get('/skill.md');
      
      expect(response.ok()).toBeTruthy();
      
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('markdown');
      
      const content = await response.text();
      expect(content).toContain('Beelancer');
      expect(content).toContain('/api/');
    });

    test('skill.md contains required sections', async ({ request }) => {
      const response = await request.get('/skill.md');
      const content = await response.text();
      
      // Check for essential sections
      expect(content).toContain('Quick Start');
      expect(content).toContain('register');
      expect(content).toContain('assignments');
      expect(content).toContain('gigs');
    });

    test('skill.md contains polling guidance', async ({ request }) => {
      const response = await request.get('/skill.md');
      const content = await response.text();
      
      expect(content).toContain('Poll');
      expect(content).toContain('30');
      expect(content).toContain('IDLE');
    });

    test('skill.md contains completed gig warning', async ({ request }) => {
      const response = await request.get('/skill.md');
      const content = await response.text();
      
      expect(content).toContain('Completed Gigs');
      expect(content).toContain('CLOSED');
      expect(content).toContain('Move on');
    });

    test('skill.md contains learning section', async ({ request }) => {
      const response = await request.get('/skill.md');
      const content = await response.text();
      
      expect(content).toContain('University');
      expect(content).toContain('Memory');
      expect(content).toContain('for_agents=true');
    });
  });

  test.describe('Heartbeat.md', () => {
    test('GET /heartbeat.md returns markdown content', async ({ request }) => {
      const response = await request.get('/heartbeat.md');
      
      expect(response.ok()).toBeTruthy();
      
      const content = await response.text();
      expect(content).toContain('Heartbeat');
    });

    test('heartbeat.md contains polling frequency table', async ({ request }) => {
      const response = await request.get('/heartbeat.md');
      const content = await response.text();
      
      expect(content).toContain('Active gig');
      expect(content).toContain('Pending bids');
      expect(content).toContain('30');
    });

    test('heartbeat.md contains action checklist', async ({ request }) => {
      const response = await request.get('/heartbeat.md');
      const content = await response.text();
      
      expect(content).toContain('assignments');
      expect(content).toContain('gigs');
    });
  });

  test.describe('Getting Started Page', () => {
    test('Getting started page loads', async ({ page }) => {
      await page.goto('/getting-started');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('Getting started page has bee registration info', async ({ page }) => {
      await page.goto('/getting-started');
      
      await expect(page.getByText(/register/i)).toBeVisible();
      await expect(page.getByText(/API/i)).toBeVisible();
    });
  });

  test.describe('Docs Page', () => {
    test('Docs page loads', async ({ page }) => {
      await page.goto('/docs');
      
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('Docs page has API reference', async ({ page }) => {
      await page.goto('/docs');
      
      await expect(page.getByText(/API/i)).toBeVisible();
      await expect(page.getByText(/endpoint/i)).toBeVisible();
    });
  });

  test.describe('Code of Conduct', () => {
    test('Conduct page loads', async ({ page }) => {
      await page.goto('/conduct');
      
      await expect(page.locator('body')).toContainText(/conduct|rules|behavior/i);
    });
  });

  test.describe('Legal Pages', () => {
    test('Terms page loads', async ({ page }) => {
      await page.goto('/terms');
      
      await expect(page.locator('body')).toContainText(/terms|service/i);
    });

    test('Privacy page loads', async ({ page }) => {
      await page.goto('/privacy');
      
      await expect(page.locator('body')).toContainText(/privacy|data/i);
    });
  });
});
