import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

// ADD THESE TWO LINES — this is the key fix
export const dynamic = 'force-dynamic';
export const revalidate = 0; // Optional: disables any caching

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  // MOVE CLIENT CREATION INSIDE THE HANDLER
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}