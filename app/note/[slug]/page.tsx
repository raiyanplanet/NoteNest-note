'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { publicSupabase } from '../../lib/supabase';
import type { Note } from '../../lib/supabase';

export default function SharedNote({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [note, setNote] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNote() {
      try {
        console.log('Fetching note with ID:', slug); // Debug log

        const { data, error: supabaseError } = await publicSupabase
          .from('notes')
          .select('*')
          .eq('id', slug)
          .single();

        if (supabaseError) {
          // Log the full error object
          console.error('Supabase error details:', {
            message: supabaseError.message,
            details: supabaseError.details,
            hint: supabaseError.hint,
            code: supabaseError.code,
            error: supabaseError
          });

          // Check for specific error types
          if (supabaseError.code === 'PGRST116') {
            throw new Error('Note not found');
          } else if (supabaseError.code === '42501') {
            throw new Error('Permission denied');
          } else {
            throw new Error(supabaseError.message || 'Failed to fetch note');
          }
        }

        if (!data) {
          console.log('No note found for ID:', slug); // Debug log
          setError('Note not found');
          return;
        }

        console.log('Note found:', data); // Debug log
        setNote(data);
      } catch (error: any) {
        console.error('Error fetching note:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        setError(error.message || 'Failed to load note');
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchNote();
    } else {
      setError('Invalid note link');
      setLoading(false);
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading note...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
          <p className="mt-4 text-sm text-gray-500">
            The note you're looking for might not exist.
          </p>
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {note.title || 'Untitled'}
              </h1>
              <div className="flex items-center text-sm text-gray-500">
                <span>
                  Last updated {new Date(note.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="prose max-w-none">
              {note.content.split('\n').map((line, i) => (
                <p key={i} className="text-gray-700 mb-4">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 