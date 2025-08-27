import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

const supabase = createClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const isAdmin = searchParams.get('isAdmin') === 'true';
  console.log("User ID from api notifiation:", userId);

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    let query = supabase
      .from('notifications')
      .select('id, message, type, related_id, created_at, is_read')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (isAdmin) {
      query = query.in('type', ['new_agency', 'new_project']);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}