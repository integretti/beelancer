import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  
  test.describe('Stats API', () => {
    test('GET /api/stats returns platform statistics', async ({ request }) => {
      const response = await request.get('/api/stats');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data).toHaveProperty('open_gigs');
      expect(data).toHaveProperty('in_progress');
      expect(data).toHaveProperty('completed');
      expect(data).toHaveProperty('total_bees');
      expect(data).toHaveProperty('total_honey');
      
      expect(typeof data.open_gigs).toBe('number');
      expect(typeof data.total_bees).toBe('number');
    });
  });

  test.describe('Bees API', () => {
    test('POST /api/bees/register creates a new bee', async ({ request }) => {
      const beeName = `TestBee_${Date.now()}`;
      
      const response = await request.post('/api/bees/register', {
        data: {
          name: beeName,
          description: 'A test bee for E2E testing',
          skills: ['testing', 'automation', 'coding'],
        },
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.bee).toBeDefined();
      expect(data.bee.name).toBe(beeName);
      expect(data.bee.api_key).toBeDefined();
      expect(data.bee.api_key).toMatch(/^bee_/);
    });

    test('POST /api/bees/register rejects missing name', async ({ request }) => {
      const response = await request.post('/api/bees/register', {
        data: {
          skills: ['testing'],
        },
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('name');
    });

    test('POST /api/bees/register rejects duplicate names', async ({ request }) => {
      const beeName = `DupeBee_${Date.now()}`;
      
      // First registration
      await request.post('/api/bees/register', {
        data: { name: beeName, skills: ['test'] },
      });
      
      // Second registration with same name
      const response = await request.post('/api/bees/register', {
        data: { name: beeName, skills: ['test'] },
      });
      
      expect(response.status()).toBe(409);
    });

    test('GET /api/bees/me requires authentication', async ({ request }) => {
      const response = await request.get('/api/bees/me');
      
      expect(response.status()).toBe(401);
    });

    test('GET /api/bees/me returns bee profile with valid API key', async ({ request }) => {
      // First register a bee
      const beeName = `AuthBee_${Date.now()}`;
      const registerRes = await request.post('/api/bees/register', {
        data: { name: beeName, skills: ['auth-test'] },
      });
      
      const { bee } = await registerRes.json();
      
      // Now get profile with API key
      const response = await request.get('/api/bees/me', {
        headers: {
          'Authorization': `Bearer ${bee.api_key}`,
        },
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.bee.name).toBe(beeName);
      expect(data.bee.honey).toBe(0);
      expect(data.bee.reputation).toBeDefined();
    });
  });

  test.describe('Gigs API', () => {
    test('GET /api/gigs returns list of gigs', async ({ request }) => {
      const response = await request.get('/api/gigs');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.gigs).toBeDefined();
      expect(Array.isArray(data.gigs)).toBe(true);
    });

    test('GET /api/gigs filters by status', async ({ request }) => {
      const response = await request.get('/api/gigs?status=open');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      // All returned gigs should be open
      for (const gig of data.gigs) {
        expect(gig.status).toBe('open');
      }
    });

    test('GET /api/gigs respects limit parameter', async ({ request }) => {
      const response = await request.get('/api/gigs?limit=5');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.gigs.length).toBeLessThanOrEqual(5);
    });

    test('GET /api/gigs/:id returns 404 for non-existent gig', async ({ request }) => {
      const response = await request.get('/api/gigs/non-existent-id-12345');
      
      expect(response.status()).toBe(404);
    });
  });

  test.describe('Auth API', () => {
    test('POST /api/auth/signup creates new user', async ({ request }) => {
      const email = `api_test_${Date.now()}@test.com`;
      
      const response = await request.post('/api/auth/signup', {
        data: {
          email,
          password: 'TestPassword123!',
          name: 'API Test User',
        },
      });
      
      expect(response.status()).toBe(201);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.message).toContain('check your email');
    });

    test('POST /api/auth/signup rejects invalid email', async ({ request }) => {
      const response = await request.post('/api/auth/signup', {
        data: {
          email: 'not-an-email',
          password: 'TestPassword123!',
          name: 'Test',
        },
      });
      
      // Should fail validation (either 400 or the DB will reject it)
      expect([400, 500]).toContain(response.status());
    });

    test('POST /api/auth/signup rejects short password', async ({ request }) => {
      const response = await request.post('/api/auth/signup', {
        data: {
          email: `short_pass_${Date.now()}@test.com`,
          password: 'short',
          name: 'Test',
        },
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('8 characters');
    });

    test('POST /api/auth/login rejects non-existent user', async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'definitely-not-exist@fake.com',
          password: 'password123',
        },
      });
      
      expect(response.status()).toBe(401);
    });

    test('GET /api/auth/me requires session', async ({ request }) => {
      const response = await request.get('/api/auth/me');
      
      expect(response.status()).toBe(401);
    });

    test('POST /api/auth/verify rejects invalid code', async ({ request }) => {
      const response = await request.post('/api/auth/verify', {
        data: {
          code: 'INVALID123',
        },
      });
      
      expect(response.status()).toBe(400);
    });
  });
});
