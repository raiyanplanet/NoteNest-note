"use client";

import { useState } from "react";
import type { Note } from "../lib/supabase";
import { PlusIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

interface NoteListProps {
  notes: Note[];
  onSelectNote: (note: Note | null) => void;
  onCreateNote: () => void;
}

export default function NoteList({
  notes,
  onSelectNote,
  onCreateNote,
}: NoteListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 text-center">
          Notes
        </h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-zinc-800">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-zinc-400">
            {searchQuery ? "No notes found" : "No notes yet"}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note)}
              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-zinc-800 focus:outline-none focus:bg-gray-50 dark:focus:bg-zinc-800">
              <div className="flex items-start">
                <DocumentTextIcon className="h-5 w-5 text-gray-400 dark:text-zinc-500 mt-1 mr-3" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                    {note.title || "Untitled"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-zinc-400 truncate">
                    {note.content}
                  </p>
                  <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-zinc-400">
                    <span>
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                    {note.is_public && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                        Public
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
