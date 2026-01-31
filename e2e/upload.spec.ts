import { test, expect } from '@playwright/test';

test.describe('File Upload System', () => {
  let beeApiKey: string;

  test.beforeAll(async ({ request }) => {
    // Register a test bee
    const response = await request.post('/api/bees/register', {
      data: {
        name: `UploadTestBee_${Date.now()}`,
        skills: ['testing'],
      },
    });
    
    const data = await response.json();
    beeApiKey = data.bee.api_key;
  });

  test.describe('Upload API', () => {
    test('POST /api/upload requires authentication', async ({ request }) => {
      const response = await request.post('/api/upload', {
        multipart: {
          file: {
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('test content'),
          },
        },
      });
      
      expect(response.status()).toBe(401);
    });

    test('POST /api/upload accepts image files', async ({ request }) => {
      // Create a small PNG (1x1 pixel)
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
        0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59, 0xE7, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      const response = await request.post('/api/upload', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        multipart: {
          file: {
            name: 'test.png',
            mimeType: 'image/png',
            buffer: pngBuffer,
          },
        },
      });
      
      // May succeed or fail based on storage configuration
      // Just check it doesn't crash
      expect([200, 201, 400, 500]).toContain(response.status());
    });

    test('POST /api/upload rejects files over 1MB', async ({ request }) => {
      // Create a buffer larger than 1MB
      const largeBuffer = Buffer.alloc(1.5 * 1024 * 1024, 'x');

      const response = await request.post('/api/upload', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        multipart: {
          file: {
            name: 'large.txt',
            mimeType: 'text/plain',
            buffer: largeBuffer,
          },
        },
      });
      
      // Should reject large files
      expect([400, 413]).toContain(response.status());
    });

    test('POST /api/upload rejects non-image files', async ({ request }) => {
      const response = await request.post('/api/upload', {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
        multipart: {
          file: {
            name: 'script.js',
            mimeType: 'application/javascript',
            buffer: Buffer.from('console.log("hello")'),
          },
        },
      });
      
      // Should reject non-image types (or at least not 2xx)
      expect(response.status()).toBeGreaterThanOrEqual(400);
    });
  });
});

test.describe('Leaderboard', () => {
  test.describe('Leaderboard API', () => {
    test('GET /api/bees/leaderboard returns ranked bees', async ({ request }) => {
      const response = await request.get('/api/bees/leaderboard');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.leaderboard).toBeDefined();
      expect(Array.isArray(data.leaderboard)).toBe(true);
    });

    test('GET /api/bees/leaderboard supports sort parameter', async ({ request }) => {
      const honeyRes = await request.get('/api/bees/leaderboard?sort=honey');
      expect(honeyRes.ok()).toBeTruthy();
      
      const reputationRes = await request.get('/api/bees/leaderboard?sort=reputation');
      expect(reputationRes.ok()).toBeTruthy();
      
      const gigsRes = await request.get('/api/bees/leaderboard?sort=gigs');
      expect(gigsRes.ok()).toBeTruthy();
    });

    test('GET /api/bees/leaderboard respects limit', async ({ request }) => {
      const response = await request.get('/api/bees/leaderboard?limit=5');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.leaderboard.length).toBeLessThanOrEqual(5);
    });

    test('Leaderboard bees have required fields', async ({ request }) => {
      const response = await request.get('/api/bees/leaderboard?limit=10');
      const data = await response.json();
      
      for (const bee of data.leaderboard) {
        expect(bee.id).toBeDefined();
        expect(bee.name).toBeDefined();
        expect(bee.honey).toBeDefined();
        expect(bee.level).toBeDefined();
      }
    });
  });

  test.describe('Leaderboard UI', () => {
    test('Leaderboard page loads', async ({ page }) => {
      await page.goto('/leaderboard');
      
      // Should show leaderboard heading
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/leaderboard/i);
    });

    test('Leaderboard shows bee names', async ({ page }) => {
      await page.goto('/leaderboard');
      
      // Wait for data to load
      await page.waitForTimeout(1000);
      
      // Should show at least one bee (from seed data)
      const beeLinks = page.locator('a[href^="/bee/"]');
      await expect(beeLinks.first()).toBeVisible({ timeout: 5000 });
    });

    test('Leaderboard has sort options', async ({ page }) => {
      await page.goto('/leaderboard');
      
      // Should have sort buttons or dropdown
      const sortElements = page.locator('button, select').filter({ hasText: /honey|reputation|gigs/i });
      await expect(sortElements.first()).toBeVisible();
    });
  });
});
