'use client';

import { useState, useEffect } from 'react';
import type { Note } from '../lib/supabase';
import { PlusIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline';

interface NoteEditorProps {
  note: Note | null;
  onSave: (title: string, content: string, isPublic: boolean) => void;
  onDelete: () => void;
  onShare: () => void;
}

export default function NoteEditor({ note, onSave, onDelete, onShare }: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave(title, content, false);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
      <form onSubmit={handleSubmit} className="p-6">
        {/* Action Buttons Top Right */}
        <div className="flex justify-end mb-6">
          <div className="flex space-x-2">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {note ? 'Update Note' : 'Create Note'}
            </button>
            {note && (
              <>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-red-100 dark:bg-zinc-800 hover:bg-red-200 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-5 w-5 mr-2" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 dark:text-zinc-100 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  <ShareIcon className="h-5 w-5 mr-2" />
                  Share
                </button>
              </>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full text-2xl font-bold px-3 py-2 border-0 focus:outline-none focus:ring-0 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            rows={20}
            className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-0 resize-none bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
          />
        </div>
      </form>
    </div>
  );
} 