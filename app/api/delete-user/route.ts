import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const { userId } = await request.json();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  // First, delete all notes by this user
  const { error: notesError } = await supabase
    .from('notes')
    .delete()
    .eq('user_id', userId);

  if (notesError) {
    return NextResponse.json({ error: notesError.message }, { status: 500 });
  }

  // Then, delete the user
  const { error: userError } = await supabase.auth.admin.deleteUser(userId);

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 