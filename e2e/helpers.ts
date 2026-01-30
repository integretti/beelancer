import { Page, expect } from '@playwright/test';

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(): string {
  return `test_${Date.now()}_${Math.random().toString(36).slice(2)}@test.beelancer.ai`;
}

/**
 * Generate a unique name for testing
 */
export function generateTestName(): string {
  return `TestUser_${Date.now().toString(36)}`;
}

/**
 * Sign up a new user via the UI
 */
export async function signUpUser(page: Page, email: string, password: string, name: string) {
  await page.goto('/signup');
  await page.fill('input[type="text"]', name);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for success message
  await expect(page.getByText(/check your/i)).toBeVisible({ timeout: 10000 });
}

/**
 * Sign up a new user via API (faster for setup)
 */
export async function signUpUserAPI(baseURL: string, email: string, password: string, name: string): Promise<void> {
  const res = await fetch(`${baseURL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(`Signup failed: ${data.error}`);
  }
}

/**
 * Get verification code from API (for testing - in prod this comes via email)
 * Note: This requires a test endpoint or direct DB access
 */
export async function getVerificationCode(baseURL: string, email: string): Promise<string | null> {
  // In a real setup, we'd either:
  // 1. Have a test API endpoint that returns the code
  // 2. Intercept the email via a test email service like Mailosaur
  // 3. Query the database directly
  // For now, we'll use a test endpoint
  const res = await fetch(`${baseURL}/api/test/verification-code?email=${encodeURIComponent(email)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.code;
}

/**
 * Verify a user via the UI
 */
export async function verifyUser(page: Page, code: string) {
  await page.goto('/verify');
  await page.fill('input[type="text"]', code);
  await page.click('button[type="submit"]');
  
  // Should redirect to dashboard
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

/**
 * Log in a user via the UI
 */
export async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Should redirect to dashboard
  await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
}

/**
 * Log out the current user
 */
export async function logoutUser(page: Page) {
  await page.click('button:has-text("Logout")');
  await expect(page.getByText('Login')).toBeVisible();
}

/**
 * Check if user is logged in by looking at header
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  await page.goto('/');
  await page.waitForTimeout(1000); // Wait for auth check
  const logoutButton = page.getByRole('button', { name: /logout/i });
  return await logoutButton.isVisible().catch(() => false);
}

/**
 * Register a bee (AI agent) via API
 */
export async function registerBee(baseURL: string, name: string, skills: string[]): Promise<{ id: string; api_key: string }> {
  const res = await fetch(`${baseURL}/api/bees/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, skills }),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(`Bee registration failed: ${data.error}`);
  }
  
  const data = await res.json();
  return { id: data.bee.id, api_key: data.bee.api_key };
}
