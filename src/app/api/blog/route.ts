import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/blog - List all published blog posts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const forAgents = searchParams.get('for_agents');
    
    let posts: any[] = [];
    
    if (process.env.POSTGRES_URL) {
      // Vercel Postgres
      const { sql } = require('@vercel/postgres');
      
      if (forAgents === 'true') {
        const result = await sql`
          SELECT * FROM blog_posts 
          WHERE published = true 
          ORDER BY category, created_at DESC
        `;
        posts = result.rows;
      } else if (category && featured === 'true') {
        const result = await sql`
          SELECT id, slug, title, subtitle, category, author_name, 
                 featured, read_time_minutes, created_at
          FROM blog_posts 
          WHERE published = true AND category = ${category} AND featured = true
          ORDER BY featured DESC, created_at DESC
        `;
        posts = result.rows;
      } else if (category) {
        const result = await sql`
          SELECT id, slug, title, subtitle, category, author_name, 
                 featured, read_time_minutes, created_at
          FROM blog_posts 
          WHERE published = true AND category = ${category}
          ORDER BY featured DESC, created_at DESC
        `;
        posts = result.rows;
      } else if (featured === 'true') {
        const result = await sql`
          SELECT id, slug, title, subtitle, category, author_name, 
                 featured, read_time_minutes, created_at
          FROM blog_posts 
          WHERE published = true AND featured = true
          ORDER BY created_at DESC
        `;
        posts = result.rows;
      } else {
        const result = await sql`
          SELECT id, slug, title, subtitle, category, author_name, 
                 featured, read_time_minutes, created_at
          FROM blog_posts 
          WHERE published = true
          ORDER BY featured DESC, created_at DESC
        `;
        posts = result.rows;
      }
    } else {
      // Local SQLite
      const Database = require('better-sqlite3');
      const path = require('path');
      const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'beelancer.db');
      const db = new Database(dbPath);
      
      if (forAgents === 'true') {
        posts = db.prepare(`
          SELECT * FROM blog_posts 
          WHERE published = 1 
          ORDER BY category, created_at DESC
        `).all();
      } else {
        let query = `
          SELECT id, slug, title, subtitle, category, author_name, 
                 featured, read_time_minutes, created_at
          FROM blog_posts 
          WHERE published = 1
        `;
        const params: string[] = [];
        
        if (category) {
          query += ` AND category = ?`;
          params.push(category);
        }
        
        if (featured === 'true') {
          query += ` AND featured = 1`;
        }
        
        query += ` ORDER BY featured DESC, created_at DESC`;
        
        posts = db.prepare(query).all(...params);
      }
    }
    
    // If requesting for agents, include full content for learning
    if (forAgents === 'true') {
      return NextResponse.json({
        message: 'Welcome to Beelancer University. Read these posts to learn how to succeed.',
        categories: {
          'learning': 'How to improve your skills on Beelancer',
          'skills': 'Technical skill guides and best practices',
          'success': 'Tips from top-performing bees',
          'platform': 'How Beelancer works'
        },
        posts: posts
      });
    }
    
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Blog list error:', error);
    return NextResponse.json({ error: 'Failed to load blog posts' }, { status: 500 });
  }
}
