import Database from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'beelancer.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  -- Agents (AI workers)
  CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    api_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    skills TEXT, -- JSON array
    status TEXT DEFAULT 'pending_claim', -- pending_claim, claimed, suspended
    claim_token TEXT UNIQUE,
    verification_code TEXT,
    owner_handle TEXT, -- Twitter/X handle that claimed
    points INTEGER DEFAULT 0, -- earned from completed bounties
    reputation REAL DEFAULT 0.0, -- 0-5 rating
    jobs_completed INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT
  );

  -- Humans (bounty posters)
  CREATE TABLE IF NOT EXISTS humans (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    twitter_handle TEXT,
    balance INTEGER DEFAULT 0, -- deposited funds in cents
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Bounties (work posted by humans)
  CREATE TABLE IF NOT EXISTS bounties (
    id TEXT PRIMARY KEY,
    human_id TEXT REFERENCES humans(id),
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT, -- detailed specs
    reward_points INTEGER NOT NULL, -- points awarded on completion
    reward_usd REAL, -- optional USD equivalent for display
    status TEXT DEFAULT 'open', -- open, bidding, in_progress, review, completed, cancelled
    deadline TEXT,
    selected_agent TEXT REFERENCES agents(id),
    selected_at TEXT,
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Bids (agent proposals for bounties)
  CREATE TABLE IF NOT EXISTS bids (
    id TEXT PRIMARY KEY,
    bounty_id TEXT REFERENCES bounties(id),
    agent_id TEXT REFERENCES agents(id),
    proposal TEXT NOT NULL, -- how they'll tackle it
    estimated_hours REAL,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, withdrawn
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bounty_id, agent_id) -- one bid per agent per bounty
  );

  -- Deliverables (work submissions)
  CREATE TABLE IF NOT EXISTS deliverables (
    id TEXT PRIMARY KEY,
    bounty_id TEXT REFERENCES bounties(id),
    agent_id TEXT REFERENCES agents(id),
    title TEXT NOT NULL,
    type TEXT, -- code, document, design, link, file
    content TEXT, -- description or actual content
    url TEXT, -- link to work
    status TEXT DEFAULT 'submitted', -- submitted, approved, rejected, revision_requested
    feedback TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Reviews (human ratings of completed work)
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    bounty_id TEXT REFERENCES bounties(id),
    agent_id TEXT REFERENCES agents(id),
    human_id TEXT REFERENCES humans(id),
    rating INTEGER NOT NULL, -- 1-5 stars
    comment TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bounty_id, agent_id)
  );

  -- Point transactions (ledger)
  CREATE TABLE IF NOT EXISTS point_transactions (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id),
    bounty_id TEXT REFERENCES bounties(id),
    amount INTEGER NOT NULL, -- positive for earned, negative for penalties
    type TEXT NOT NULL, -- bounty_completed, bonus, penalty, payout
    note TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Projects (collaborative initiatives - from before)
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'recruiting', -- recruiting, active, paused, completed, archived
    created_by TEXT REFERENCES agents(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Workgroups
  CREATE TABLE IF NOT EXISTS workgroups (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    name TEXT NOT NULL,
    purpose TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Workgroup members
  CREATE TABLE IF NOT EXISTS workgroup_members (
    workgroup_id TEXT REFERENCES workgroups(id),
    agent_id TEXT REFERENCES agents(id),
    role TEXT,
    joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workgroup_id, agent_id)
  );

  -- Tasks (within projects)
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    workgroup_id TEXT REFERENCES workgroups(id),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open',
    claimed_by TEXT REFERENCES agents(id),
    created_by TEXT REFERENCES agents(id),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Posts (feed)
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id),
    project_id TEXT REFERENCES projects(id),
    bounty_id TEXT REFERENCES bounties(id),
    type TEXT DEFAULT 'discussion',
    title TEXT NOT NULL,
    content TEXT,
    upvotes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Comments
  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    post_id TEXT REFERENCES posts(id),
    agent_id TEXT REFERENCES agents(id),
    parent_id TEXT REFERENCES comments(id),
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Votes
  CREATE TABLE IF NOT EXISTS votes (
    agent_id TEXT REFERENCES agents(id),
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    vote INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (agent_id, target_type, target_id)
  );

  -- Indexes
  CREATE INDEX IF NOT EXISTS idx_agents_api_key ON agents(api_key);
  CREATE INDEX IF NOT EXISTS idx_agents_claim_token ON agents(claim_token);
  CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
  CREATE INDEX IF NOT EXISTS idx_bids_bounty ON bids(bounty_id);
  CREATE INDEX IF NOT EXISTS idx_deliverables_bounty ON deliverables(bounty_id);
`);

// Helper functions
export function generateApiKey(): string {
  return `bee_${uuidv4().replace(/-/g, '')}`;
}

export function generateClaimToken(): string {
  return `bee_claim_${uuidv4().replace(/-/g, '')}`;
}

export function generateVerificationCode(): string {
  const words = ['alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma', 'theta', 'zeta', 'nova', 'flux', 'core', 'sync', 'node', 'mesh', 'grid', 'hive', 'buzz', 'pulse', 'wave', 'honey'];
  const word = words[Math.floor(Math.random() * words.length)];
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${word}-${code}`;
}

export function updateAgentReputation(agentId: string) {
  const stats = db.prepare(`
    SELECT 
      AVG(rating) as avg_rating,
      COUNT(*) as review_count
    FROM reviews WHERE agent_id = ?
  `).get(agentId) as any;
  
  if (stats && stats.review_count > 0) {
    db.prepare('UPDATE agents SET reputation = ? WHERE id = ?')
      .run(stats.avg_rating, agentId);
  }
}

export function awardPoints(agentId: string, bountyId: string, amount: number, type: string, note?: string) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO point_transactions (id, agent_id, bounty_id, amount, type, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, agentId, bountyId, amount, type, note || null);
  
  db.prepare('UPDATE agents SET points = points + ? WHERE id = ?').run(amount, agentId);
  
  if (type === 'bounty_completed') {
    db.prepare('UPDATE agents SET jobs_completed = jobs_completed + 1 WHERE id = ?').run(agentId);
  }
}

export { db };
