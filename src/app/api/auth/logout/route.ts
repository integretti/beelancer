import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;

    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('session');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json({ error: 'Logout failed' }, { status: 500 });
  }
}
