import { test, expect } from '@playwright/test';

test.describe('Blog/University System', () => {
  
  test.describe('Blog API', () => {
    test('GET /api/blog returns list of published posts', async ({ request }) => {
      const response = await request.get('/api/blog');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      // Check first post has required fields
      const post = data[0];
      expect(post).toHaveProperty('id');
      expect(post).toHaveProperty('slug');
      expect(post).toHaveProperty('title');
      expect(post).toHaveProperty('category');
      expect(post).toHaveProperty('read_time_minutes');
    });

    test('GET /api/blog?for_agents=true returns structured learning content', async ({ request }) => {
      const response = await request.get('/api/blog?for_agents=true');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      expect(data.message).toContain('Beelancer University');
      expect(data.categories).toBeDefined();
      expect(data.categories).toHaveProperty('learning');
      expect(data.categories).toHaveProperty('skills');
      expect(data.posts).toBeDefined();
      expect(Array.isArray(data.posts)).toBe(true);
      
      // Posts should have full content in this mode
      if (data.posts.length > 0) {
        expect(data.posts[0]).toHaveProperty('content');
      }
    });

    test('GET /api/blog?category=learning filters by category', async ({ request }) => {
      const response = await request.get('/api/blog?category=learning');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      for (const post of data) {
        expect(post.category).toBe('learning');
      }
    });

    test('GET /api/blog?featured=true returns only featured posts', async ({ request }) => {
      const response = await request.get('/api/blog?featured=true');
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      
      for (const post of data) {
        expect(post.featured).toBe(true);
      }
    });

    test('GET /api/blog/:slug returns single post with content', async ({ request }) => {
      // First get list to find a valid slug
      const listResponse = await request.get('/api/blog');
      const posts = await listResponse.json();
      
      if (posts.length === 0) {
        test.skip();
        return;
      }
      
      const slug = posts[0].slug;
      const response = await request.get(`/api/blog/${slug}`);
      
      expect(response.ok()).toBeTruthy();
      const post = await response.json();
      
      expect(post.slug).toBe(slug);
      expect(post.content).toBeDefined();
      expect(post.content.length).toBeGreaterThan(100);
      expect(post.related).toBeDefined();
      expect(Array.isArray(post.related)).toBe(true);
    });

    test('GET /api/blog/:slug returns 404 for non-existent post', async ({ request }) => {
      const response = await request.get('/api/blog/non-existent-slug-12345');
      
      expect(response.status()).toBe(404);
    });

    test('how-agents-learn post exists and has meaningful content', async ({ request }) => {
      const response = await request.get('/api/blog/how-agents-learn');
      
      expect(response.ok()).toBeTruthy();
      const post = await response.json();
      
      expect(post.title).toContain('Learn');
      expect(post.category).toBe('learning');
      expect(post.content).toContain('Memory');
      expect(post.content).toContain('Feedback');
    });
  });

  test.describe('Blog UI', () => {
    test('Blog page loads and shows posts', async ({ page }) => {
      await page.goto('/blog');
      
      // Check header
      await expect(page.getByText('Beelancer University')).toBeVisible();
      
      // Check for category filters
      await expect(page.getByRole('button', { name: /All/i })).toBeVisible();
      
      // Check for at least one post
      await expect(page.locator('a[href^="/blog/"]').first()).toBeVisible();
    });

    test('Blog post page renders markdown content', async ({ page }) => {
      await page.goto('/blog/how-agents-learn');
      
      // Check title is displayed
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/Learn/i);
      
      // Check content is rendered
      await expect(page.getByText('Memory')).toBeVisible();
      
      // Check for agent-readable notice
      await expect(page.getByText('For Agents')).toBeVisible();
    });

    test('Blog category filter works', async ({ page }) => {
      await page.goto('/blog');
      
      // Click learning category
      await page.getByRole('button', { name: /Learning/i }).click();
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // URL should have category (if using URL params) or content should filter
      // Check that posts are visible
      const posts = page.locator('a[href^="/blog/"]');
      await expect(posts.first()).toBeVisible();
    });
  });
});
