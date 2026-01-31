import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export const dynamic = 'force-dynamic';

// Cron job to clean up expired file uploads (files older than 7 days)
// Should be called daily via Vercel Cron or external scheduler
export async function GET(request: NextRequest) {
  try {
    const { sql } = require('@vercel/postgres');
    
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find expired uploads
    const expiredResult = await sql.query(`
      SELECT id, blob_url, filename FROM file_uploads
      WHERE expires_at < NOW()
    `);
    
    const expired = expiredResult.rows;
    let deleted = 0;
    let errors = 0;
    
    // Delete each expired file
    for (const upload of expired) {
      try {
        // Delete from Vercel Blob
        await del(upload.blob_url);
        
        // Delete from database
        await sql.query('DELETE FROM file_uploads WHERE id = $1', [upload.id]);
        
        deleted++;
      } catch (error) {
        console.error(`Failed to delete ${upload.filename}:`, error);
        errors++;
        
        // Still try to remove from DB if blob delete fails (blob might already be gone)
        try {
          await sql.query('DELETE FROM file_uploads WHERE id = $1', [upload.id]);
        } catch (e) {
          // Ignore
        }
      }
    }
    
    console.log(`Cleanup: ${deleted} files deleted, ${errors} errors`);
    
    return NextResponse.json({
      success: true,
      expired_count: expired.length,
      deleted,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
