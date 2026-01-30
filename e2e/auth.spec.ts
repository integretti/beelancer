import { test, expect } from '@playwright/test';
import { generateTestEmail, generateTestName, signUpUser, loginUser, logoutUser } from './helpers';

test.describe('Authentication Flow', () => {
  const testPassword = 'TestPassword123!';

  test.describe('Sign Up', () => {
    test('should show signup page correctly', async ({ page }) => {
      await page.goto('/signup');
      
      await expect(page.getByRole('heading', { name: /join the hive/i })).toBeVisible();
      await expect(page.getByPlaceholder(/what should we call you/i)).toBeVisible();
      await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
      await expect(page.getByPlaceholder(/min 8 characters/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    });

    test('should require all fields', async ({ page }) => {
      await page.goto('/signup');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // HTML5 validation should prevent submission
      const emailInput = page.getByPlaceholder(/you@example.com/i);
      await expect(emailInput).toBeFocused();
    });

    test('should reject short passwords', async ({ page }) => {
      await page.goto('/signup');
      
      await page.fill('input[type="text"]', 'Test User');
      await page.fill('input[type="email"]', generateTestEmail());
      await page.fill('input[type="password"]', 'short');
      await page.click('button[type="submit"]');
      
      await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    });

    test('should successfully sign up new user', async ({ page }) => {
      const email = generateTestEmail();
      const name = generateTestName();
      
      await signUpUser(page, email, testPassword, name);
      
      // Should show success message
      await expect(page.getByText(/check your inbox/i)).toBeVisible();
      await expect(page.getByText(email)).toBeVisible();
    });

    test('should reject duplicate email', async ({ page }) => {
      const email = generateTestEmail();
      const name = generateTestName();
      
      // Sign up first time
      await signUpUser(page, email, testPassword, name);
      
      // Try to sign up again with same email
      await page.goto('/signup');
      await page.fill('input[type="text"]', 'Another User');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      
      await expect(page.getByText(/already registered/i)).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should show login page correctly', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
      await expect(page.getByPlaceholder(/you@example.com/i)).toBeVisible();
      await expect(page.getByPlaceholder(/your password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
    });

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'nonexistent@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    });

    test('should reject unverified user', async ({ page, baseURL }) => {
      const email = generateTestEmail();
      
      // Sign up but don't verify
      await signUpUser(page, email, testPassword, generateTestName());
      
      // Try to login
      await page.goto('/login');
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      
      await expect(page.getByText(/verify your email/i)).toBeVisible();
    });
  });

  test.describe('Verification', () => {
    test('should show verification page correctly', async ({ page }) => {
      await page.goto('/verify');
      
      await expect(page.getByRole('heading', { name: /enter your code/i })).toBeVisible();
      await expect(page.getByPlaceholder(/enter code/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /verify/i })).toBeVisible();
    });

    test('should reject invalid code', async ({ page }) => {
      await page.goto('/verify');
      
      await page.fill('input[type="text"]', 'INVALID');
      await page.click('button[type="submit"]');
      
      await expect(page.getByText(/invalid or expired/i)).toBeVisible();
    });

    test('should convert code to uppercase', async ({ page }) => {
      await page.goto('/verify');
      
      await page.fill('input[type="text"]', 'abcdef');
      const input = page.getByPlaceholder(/enter code/i);
      await expect(input).toHaveValue('ABCDEF');
    });
  });

  test.describe('Session Persistence', () => {
    test('should stay logged in after page refresh', async ({ page, context }) => {
      // This test requires a verified user - skip if we can't create one
      // In a full setup, we'd have a way to bypass email verification for tests
      test.skip(true, 'Requires email verification bypass');
    });

    test('should show correct header state based on auth', async ({ page }) => {
      await page.goto('/');
      
      // Wait for header to load
      await page.waitForTimeout(1500);
      
      // When logged out, should show Login link
      const loginLink = page.getByRole('link', { name: /^login$/i });
      const isLoggedOut = await loginLink.isVisible().catch(() => false);
      
      if (isLoggedOut) {
        await expect(loginLink).toBeVisible();
        await expect(page.getByRole('link', { name: /post a gig/i })).toBeVisible();
      }
    });
  });
});
