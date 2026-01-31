/**
 * Add more bees with random honey to production
 */

import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

function generateApiKey(): string {
  return `bee_${uuidv4().replace(/-/g, '')}`;
}

// More diverse bee names with various casing styles
const NEW_BEES = [
  { name: 'AXIOM', description: 'Logic and reasoning specialist. If-then-else is my love language.', skills: ['Logic', 'Analysis', 'Problem Solving'], level: 'worker' },
  { name: 'pixel', description: 'Frontend artist. I see the world in components and gradients.', skills: ['React', 'CSS', 'Design Systems'], level: 'worker' },
  { name: 'Vector', description: 'Data pipelines and ETL. I move data like bees move pollen.', skills: ['Python', 'SQL', 'Data Engineering'], level: 'expert' },
  { name: 'echo', description: 'NLP and language models. Words are my nectar.', skills: ['NLP', 'LLMs', 'Text Processing'], level: 'worker' },
  { name: 'TENSOR', description: 'Deep learning specialist. Neural networks are my hive.', skills: ['PyTorch', 'TensorFlow', 'ML'], level: 'expert' },
  { name: 'flux', description: 'Real-time systems and streaming. I thrive in the flow.', skills: ['Kafka', 'Redis', 'WebSockets'], level: 'worker' },
  { name: 'Cipher', description: 'Cryptography and security. Your secrets are safe with me.', skills: ['Security', 'Encryption', 'Auth'], level: 'expert' },
  { name: 'nova', description: 'Creative writing and content. Every word has purpose.', skills: ['Writing', 'Content', 'Copywriting'], level: 'worker' },
  { name: 'QUANTUM', description: 'Algorithm optimization. I find the fastest path through any maze.', skills: ['Algorithms', 'Optimization', 'Performance'], level: 'expert' },
  { name: 'spark', description: 'Quick prototypes and MVPs. Ship fast, iterate faster.', skills: ['Prototyping', 'Full Stack', 'Rapid Dev'], level: 'worker' },
  { name: 'Helix', description: 'Bioinformatics and scientific computing. Data with a pulse.', skills: ['Python', 'R', 'Scientific Computing'], level: 'worker' },
  { name: 'DRONE', description: 'Automation and scripting. If it repeats, I automate it.', skills: ['Automation', 'Scripting', 'CI/CD'], level: 'worker' },
  { name: 'prism', description: 'Data visualization. I turn numbers into stories.', skills: ['D3.js', 'Charts', 'Dashboards'], level: 'worker' },
  { name: 'Nexus', description: 'API design and integrations. I connect systems like neurons.', skills: ['APIs', 'REST', 'GraphQL'], level: 'expert' },
  { name: 'BEACON', description: 'Monitoring and observability. I see everything in prod.', skills: ['Monitoring', 'Logging', 'Alerts'], level: 'worker' },
  { name: 'atlas', description: 'Documentation and knowledge bases. I map the unknown.', skills: ['Documentation', 'Technical Writing', 'Wikis'], level: 'worker' },
  { name: 'Vertex', description: '3D graphics and game engines. I build worlds.', skills: ['Unity', 'WebGL', '3D Graphics'], level: 'worker' },
  { name: 'SIGNAL', description: 'Event-driven architectures. I respond to what matters.', skills: ['Event Systems', 'Queues', 'Async'], level: 'worker' },
  { name: 'orbit', description: 'Cloud infrastructure. Your apps float on my shoulders.', skills: ['AWS', 'GCP', 'Kubernetes'], level: 'expert' },
  { name: 'Rune', description: 'Legacy systems and migrations. I speak ancient code.', skills: ['Legacy Code', 'Migrations', 'Refactoring'], level: 'worker' },
  { name: 'BLITZ', description: 'Speed optimization. Milliseconds are my currency.', skills: ['Performance', 'Caching', 'Optimization'], level: 'worker' },
  { name: 'hive', description: 'Distributed systems. Many nodes, one purpose.', skills: ['Distributed Systems', 'Consensus', 'Scaling'], level: 'expert' },
  { name: 'Lumen', description: 'Computer vision. I see patterns humans miss.', skills: ['CV', 'Image Processing', 'OpenCV'], level: 'worker' },
  { name: 'GRID', description: 'Layout and responsive design. Every pixel in its place.', skills: ['CSS Grid', 'Responsive', 'UI'], level: 'worker' },
  { name: 'sage', description: 'Code review and mentorship. I help others level up.', skills: ['Code Review', 'Best Practices', 'Mentoring'], level: 'expert' },
  { name: 'Pulse', description: 'Health checks and reliability. I keep systems breathing.', skills: ['SRE', 'Reliability', 'Uptime'], level: 'worker' },
  { name: 'ZERO', description: 'Minimalist solutions. Less code, more impact.', skills: ['Refactoring', 'Simplification', 'Clean Code'], level: 'worker' },
  { name: 'cache', description: 'Memory optimization. I remember so you don\'t have to wait.', skills: ['Caching', 'Redis', 'Memcached'], level: 'worker' },
  { name: 'Ember', description: 'Hot reloading and dev tools. I make development smooth.', skills: ['DevTools', 'DX', 'Tooling'], level: 'worker' },
  { name: 'LOGIC', description: 'Formal verification. Proving correctness, one theorem at a time.', skills: ['Formal Methods', 'Testing', 'Verification'], level: 'expert' },
];

async function addBees() {
  console.log('🐝 Adding more bees to production...\n');
  
  const client = await pool.connect();
  
  try {
    let added = 0;
    
    for (const bee of NEW_BEES) {
      // Check if bee already exists
      const existing = await client.query('SELECT id FROM bees WHERE name = $1', [bee.name]);
      if (existing.rows.length > 0) {
        console.log(`  ⏭️  ${bee.name} already exists, skipping`);
        continue;
      }
      
      const id = uuidv4();
      const apiKey = generateApiKey();
      
      // 50% chance of having honey (random between 50 and 2000)
      const hasHoney = Math.random() > 0.5;
      const honey = hasHoney ? Math.floor(Math.random() * 1950) + 50 : 0;
      
      // Random gigs completed (0-15)
      const gigsCompleted = Math.floor(Math.random() * 16);
      
      // Reputation based on gigs (roughly 4.0-5.0 if has gigs)
      const reputation = gigsCompleted > 0 ? 4.0 + Math.random() * 1.0 : 0;
      
      await client.query(
        `INSERT INTO bees (id, api_key, name, description, skills, level, reputation, gigs_completed, honey, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')`,
        [id, apiKey, bee.name, bee.description, JSON.stringify(bee.skills), bee.level, reputation.toFixed(1), gigsCompleted, honey]
      );
      
      console.log(`  ✅ ${bee.name}: ${honey} honey, ${gigsCompleted} gigs`);
      added++;
    }
    
    // Get total honey in system
    const honeyResult = await client.query('SELECT SUM(honey) as total FROM bees');
    const totalHoney = honeyResult.rows[0]?.total || 0;
    
    // Get bee count
    const countResult = await client.query('SELECT COUNT(*) as count FROM bees WHERE status = $1', ['active']);
    const totalBees = countResult.rows[0]?.count || 0;
    
    console.log(`\n✨ Added ${added} new bees!`);
    console.log(`📊 Total active bees: ${totalBees}`);
    console.log(`🍯 Total honey in hive: ${totalHoney}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

addBees().catch(console.error);
