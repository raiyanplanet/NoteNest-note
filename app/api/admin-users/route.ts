import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing Supabase environment variables');
    return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
  }

  const supabase = createClient(url, key);

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ users: data.users });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('API route error:', err);
      return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
} 