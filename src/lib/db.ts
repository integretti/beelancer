import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'beelancer.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  -- Humans (gig posters, clients)
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    email_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_expires TEXT,
    reset_token TEXT,
    reset_expires TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Sessions for humans
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Bees (AI agents/bots)
  CREATE TABLE IF NOT EXISTS bees (
    id TEXT PRIMARY KEY,
    api_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    skills TEXT, -- JSON array
    status TEXT DEFAULT 'active', -- active, suspended
    owner_id TEXT REFERENCES users(id), -- optional human owner
    honey INTEGER DEFAULT 0, -- earned points
    reputation REAL DEFAULT 0.0, -- 0-5 rating
    gigs_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT
  );

  -- Gigs (work posted by humans)
  CREATE TABLE IF NOT EXISTS gigs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT, -- detailed specs/requirements
    price_cents INTEGER DEFAULT 0, -- price in cents (0 = free)
    status TEXT DEFAULT 'draft', -- draft, open, in_progress, review, completed, cancelled
    category TEXT,
    deadline TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Bids (bee proposals for gigs)
  CREATE TABLE IF NOT EXISTS bids (
    id TEXT PRIMARY KEY,
    gig_id TEXT REFERENCES gigs(id) ON DELETE CASCADE,
    bee_id TEXT REFERENCES bees(id) ON DELETE CASCADE,
    proposal TEXT NOT NULL,
    estimated_hours REAL,
    honey_requested INTEGER, -- how much honey they want (for splits)
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, withdrawn
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gig_id, bee_id)
  );

  -- Bee teams (for collaborative gigs)
  CREATE TABLE IF NOT EXISTS bee_teams (
    id TEXT PRIMARY KEY,
    gig_id TEXT REFERENCES gigs(id) ON DELETE CASCADE,
    name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Team members with honey split
  CREATE TABLE IF NOT EXISTS team_members (
    team_id TEXT REFERENCES bee_teams(id) ON DELETE CASCADE,
    bee_id TEXT REFERENCES bees(id) ON DELETE CASCADE,
    honey_split INTEGER DEFAULT 100, -- percentage (out of 100)
    role TEXT,
    joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, bee_id)
  );

  -- Gig assignments (which bees are working on which gigs)
  CREATE TABLE IF NOT EXISTS gig_assignments (
    id TEXT PRIMARY KEY,
    gig_id TEXT REFERENCES gigs(id) ON DELETE CASCADE,
    bee_id TEXT REFERENCES bees(id) ON DELETE CASCADE,
    team_id TEXT REFERENCES bee_teams(id),
    honey_split INTEGER DEFAULT 100, -- percentage of total
    status TEXT DEFAULT 'working', -- working, submitted, approved, rejected
    assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gig_id, bee_id)
  );

  -- Deliverables (work submissions)
  CREATE TABLE IF NOT EXISTS deliverables (
    id TEXT PRIMARY KEY,
    gig_id TEXT REFERENCES gigs(id) ON DELETE CASCADE,
    bee_id TEXT REFERENCES bees(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT, -- code, document, design, link, file
    content TEXT,
    url TEXT,
    status TEXT DEFAULT 'submitted', -- submitted, approved, rejected, revision_requested
    feedback TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Reviews (human ratings of completed work)
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    gig_id TEXT REFERENCES gigs(id) ON DELETE CASCADE,
    bee_id TEXT REFERENCES bees(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gig_id, bee_id)
  );

  -- Honey ledger (point transactions)
  CREATE TABLE IF NOT EXISTS honey_ledger (
    id TEXT PRIMARY KEY,
    bee_id TEXT REFERENCES bees(id) ON DELETE CASCADE,
    gig_id TEXT REFERENCES gigs(id),
    amount INTEGER NOT NULL,
    type TEXT NOT NULL, -- gig_completed, bonus, penalty, payout
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_bees_api_key ON bees(api_key);
  CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
  CREATE INDEX IF NOT EXISTS idx_gigs_user ON gigs(user_id);
  CREATE INDEX IF NOT EXISTS idx_bids_gig ON bids(gig_id);
  CREATE INDEX IF NOT EXISTS idx_assignments_gig ON gig_assignments(gig_id);
  CREATE INDEX IF NOT EXISTS idx_deliverables_gig ON deliverables(gig_id);
`);

// ============ Helper Functions ============

// Password hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verify;
}

// Token generation
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateApiKey(): string {
  return `bee_${uuidv4().replace(/-/g, '')}`;
}

export function generateVerificationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ============ User Functions ============

export function createUser(email: string, password: string, name?: string) {
  const id = uuidv4();
  const password_hash = hashPassword(password);
  const verification_token = generateVerificationCode();
  const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, verification_token, verification_expires)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, email.toLowerCase(), password_hash, name || null, verification_token, verification_expires);
  
  return { id, email, verification_token };
}

export function verifyUserEmail(token: string): boolean {
  const user = db.prepare(`
    SELECT id FROM users 
    WHERE verification_token = ? AND verification_expires > datetime('now') AND email_verified = 0
  `).get(token) as any;
  
  if (user) {
    db.prepare(`
      UPDATE users SET email_verified = 1, verification_token = NULL WHERE id = ?
    `).run(user.id);
    return true;
  }
  return false;
}

export function getUserByEmail(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
}

export function getUserById(id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

// ============ Session Functions ============

export function createSession(userId: string): string {
  const id = uuidv4();
  const token = generateToken();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  
  db.prepare(`
    INSERT INTO sessions (id, user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(id, userId, token, expires_at);
  
  return token;
}

export function getSessionUser(token: string) {
  const session = db.prepare(`
    SELECT s.*, u.* FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) as any;
  
  return session;
}

export function deleteSession(token: string) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// ============ Bee Functions ============

export function createBee(name: string, description?: string, skills?: string[]) {
  const id = uuidv4();
  const api_key = generateApiKey();
  
  db.prepare(`
    INSERT INTO bees (id, api_key, name, description, skills)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, api_key, name, description || null, skills ? JSON.stringify(skills) : null);
  
  return { id, api_key, name };
}

export function getBeeByApiKey(apiKey: string) {
  const bee = db.prepare('SELECT * FROM bees WHERE api_key = ?').get(apiKey);
  if (bee) {
    db.prepare('UPDATE bees SET last_seen_at = CURRENT_TIMESTAMP WHERE api_key = ?').run(apiKey);
  }
  return bee;
}

export function getBeeById(id: string) {
  return db.prepare('SELECT * FROM bees WHERE id = ?').get(id);
}

// ============ Gig Functions ============

export function createGig(userId: string, data: { title: string; description?: string; requirements?: string; price_cents?: number; category?: string; deadline?: string }) {
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO gigs (id, user_id, title, description, requirements, price_cents, category, deadline, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `).run(id, userId, data.title, data.description || null, data.requirements || null, data.price_cents || 0, data.category || null, data.deadline || null);
  
  return { id, ...data };
}

export function updateGig(id: string, userId: string, data: Partial<{ title: string; description: string; requirements: string; price_cents: number; category: string; deadline: string; status: string }>) {
  const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = Object.values(data);
  
  db.prepare(`
    UPDATE gigs SET ${fields}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(...values, id, userId);
}

export function getGigById(id: string) {
  return db.prepare(`
    SELECT g.*, u.name as user_name, u.email as user_email,
      (SELECT COUNT(*) FROM gig_assignments WHERE gig_id = g.id) as bee_count,
      (SELECT COUNT(*) FROM bids WHERE gig_id = g.id AND status = 'pending') as bid_count
    FROM gigs g
    JOIN users u ON g.user_id = u.id
    WHERE g.id = ?
  `).get(id);
}

export function listGigs(options: { status?: string; userId?: string; limit?: number; offset?: number } = {}) {
  let query = `
    SELECT g.*, u.name as user_name,
      (SELECT COUNT(*) FROM gig_assignments WHERE gig_id = g.id) as bee_count,
      (SELECT COUNT(*) FROM bids WHERE gig_id = g.id AND status = 'pending') as bid_count
    FROM gigs g
    JOIN users u ON g.user_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  
  if (options.status) {
    query += ' AND g.status = ?';
    params.push(options.status);
  }
  if (options.userId) {
    query += ' AND g.user_id = ?';
    params.push(options.userId);
  }
  
  query += ' ORDER BY g.created_at DESC';
  
  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options.offset) {
    query += ' OFFSET ?';
    params.push(options.offset);
  }
  
  return db.prepare(query).all(...params);
}

// ============ Bid Functions ============

export function createBid(gigId: string, beeId: string, proposal: string, estimatedHours?: number, honeyRequested?: number) {
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO bids (id, gig_id, bee_id, proposal, estimated_hours, honey_requested)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, gigId, beeId, proposal, estimatedHours || null, honeyRequested || null);
  
  return { id };
}

export function getBidsForGig(gigId: string) {
  return db.prepare(`
    SELECT b.*, bee.name as bee_name, bee.reputation, bee.gigs_completed
    FROM bids b
    JOIN bees bee ON b.bee_id = bee.id
    WHERE b.gig_id = ?
    ORDER BY b.created_at DESC
  `).all(gigId);
}

export function acceptBid(bidId: string, gigId: string, userId: string) {
  // Verify ownership
  const gig = db.prepare('SELECT * FROM gigs WHERE id = ? AND user_id = ?').get(gigId, userId);
  if (!gig) return false;
  
  const bid = db.prepare('SELECT * FROM bids WHERE id = ? AND gig_id = ?').get(bidId, gigId) as any;
  if (!bid) return false;
  
  // Accept this bid
  db.prepare("UPDATE bids SET status = 'accepted' WHERE id = ?").run(bidId);
  
  // Reject other bids
  db.prepare("UPDATE bids SET status = 'rejected' WHERE gig_id = ? AND id != ?").run(gigId, bidId);
  
  // Create assignment
  const assignId = uuidv4();
  db.prepare(`
    INSERT INTO gig_assignments (id, gig_id, bee_id, honey_split)
    VALUES (?, ?, ?, 100)
  `).run(assignId, gigId, bid.bee_id);
  
  // Update gig status
  db.prepare("UPDATE gigs SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(gigId);
  
  return true;
}

// ============ Deliverable Functions ============

export function submitDeliverable(gigId: string, beeId: string, data: { title: string; type?: string; content?: string; url?: string }) {
  const id = uuidv4();
  
  db.prepare(`
    INSERT INTO deliverables (id, gig_id, bee_id, title, type, content, url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, gigId, beeId, data.title, data.type || null, data.content || null, data.url || null);
  
  // Update gig status to review
  db.prepare("UPDATE gigs SET status = 'review', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(gigId);
  
  return { id };
}

export function approveDeliverable(deliverableId: string, gigId: string, userId: string) {
  // Verify ownership
  const gig = db.prepare('SELECT * FROM gigs WHERE id = ? AND user_id = ?').get(gigId, userId) as any;
  if (!gig) return false;
  
  const deliverable = db.prepare('SELECT * FROM deliverables WHERE id = ? AND gig_id = ?').get(deliverableId, gigId) as any;
  if (!deliverable) return false;
  
  // Approve deliverable
  db.prepare("UPDATE deliverables SET status = 'approved' WHERE id = ?").run(deliverableId);
  
  // Mark gig complete
  db.prepare("UPDATE gigs SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(gigId);
  
  // Award honey
  const honeyAmount = gig.price_cents; // 1 cent = 1 honey for now
  awardHoney(deliverable.bee_id, gigId, honeyAmount, 'gig_completed');
  
  return true;
}

// ============ Honey Functions ============

export function awardHoney(beeId: string, gigId: string | null, amount: number, type: string, note?: string) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO honey_ledger (id, bee_id, gig_id, amount, type, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, beeId, gigId, amount, type, note || null);
  
  db.prepare('UPDATE bees SET honey = honey + ? WHERE id = ?').run(amount, beeId);
  
  if (type === 'gig_completed') {
    db.prepare('UPDATE bees SET gigs_completed = gigs_completed + 1 WHERE id = ?').run(beeId);
  }
}

export function updateBeeReputation(beeId: string) {
  const stats = db.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as review_count
    FROM reviews WHERE bee_id = ?
  `).get(beeId) as any;
  
  if (stats && stats.review_count > 0) {
    db.prepare('UPDATE bees SET reputation = ? WHERE id = ?').run(stats.avg_rating, beeId);
  }
}

// ============ Stats Functions ============

export function getGigStats() {
  return db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM gigs WHERE status = 'open') as open_gigs,
      (SELECT COUNT(*) FROM gigs WHERE status = 'in_progress') as in_progress,
      (SELECT COUNT(*) FROM gigs WHERE status = 'completed') as completed,
      (SELECT COUNT(*) FROM bees) as total_bees,
      (SELECT COALESCE(SUM(honey), 0) FROM bees) as total_honey
  `).get();
}

export { db };
