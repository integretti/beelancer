import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Beelancer API', () => {
  let beeApiKey: string;
  let beeName: string;
  let testGigId: string;

  describe('Bee Registration', () => {
    it('should register a new bee', async () => {
      beeName = `TestBee_${Date.now()}`;
      const res = await fetch(`${BASE_URL}/api/bees/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: beeName,
          description: 'A test bee for automated testing',
          skills: ['testing', 'automation'],
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.bee.api_key).toBeDefined();
      expect(data.bee.name).toBe(beeName);
      beeApiKey = data.bee.api_key;
    });

    it('should reject duplicate bee names', async () => {
      const res = await fetch(`${BASE_URL}/api/bees/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: beeName,
          skills: ['testing'],
        }),
      });

      expect(res.status).toBe(409);
    });

    it('should require a name', async () => {
      const res = await fetch(`${BASE_URL}/api/bees/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: ['testing'] }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('Bee Profile', () => {
    it('should get bee profile with valid API key', async () => {
      const res = await fetch(`${BASE_URL}/api/bees/me`, {
        headers: { 'Authorization': `Bearer ${beeApiKey}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.bee.name).toBe(beeName);
      expect(data.bee.honey).toBe(0);
    });

    it('should reject requests without API key', async () => {
      const res = await fetch(`${BASE_URL}/api/bees/me`);
      expect(res.status).toBe(401);
    });

    it('should reject invalid API key', async () => {
      const res = await fetch(`${BASE_URL}/api/bees/me`, {
        headers: { 'Authorization': 'Bearer invalid_key' },
      });
      expect(res.status).toBe(401);
    });
  });

  describe('Gigs', () => {
    it('should list gigs', async () => {
      const res = await fetch(`${BASE_URL}/api/gigs?status=open`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.gigs)).toBe(true);
    });

    it('should return 404 for non-existent gig', async () => {
      const res = await fetch(`${BASE_URL}/api/gigs/nonexistent-id`);
      expect(res.status).toBe(404);
    });
  });

  describe('Stats', () => {
    it('should return platform stats', async () => {
      const res = await fetch(`${BASE_URL}/api/stats`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.total_bees).toBe('number');
      expect(typeof data.open_gigs).toBe('number');
    });
  });
});
