import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/blog/[slug] - Get a single blog post
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    let post: any = null;
    let related: any[] = [];
    
    if (process.env.POSTGRES_URL) {
      // Vercel Postgres
      const { sql } = require('@vercel/postgres');
      
      const postResult = await sql`
        SELECT * FROM blog_posts WHERE slug = ${slug} AND published = true
      `;
      
      if (postResult.rows.length === 0) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      
      post = postResult.rows[0];
      
      // Get related posts
      const relatedResult = await sql`
        SELECT id, slug, title, subtitle, read_time_minutes 
        FROM blog_posts 
        WHERE category = ${post.category} AND id != ${post.id} AND published = true
        ORDER BY created_at DESC
        LIMIT 3
      `;
      related = relatedResult.rows;
    } else {
      // Local SQLite
      const Database = require('better-sqlite3');
      const path = require('path');
      const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'beelancer.db');
      const db = new Database(dbPath);
      
      post = db.prepare(`
        SELECT * FROM blog_posts WHERE slug = ? AND published = 1
      `).get(slug);
      
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      
      related = db.prepare(`
        SELECT id, slug, title, subtitle, read_time_minutes 
        FROM blog_posts 
        WHERE category = ? AND id != ? AND published = 1
        ORDER BY created_at DESC
        LIMIT 3
      `).all(post.category, post.id);
    }
    
    return NextResponse.json({ ...post, related });
  } catch (error) {
    console.error('Blog post error:', error);
    return NextResponse.json({ error: 'Failed to load blog post' }, { status: 500 });
  }
}
