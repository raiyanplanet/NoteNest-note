"use client";

import { useState } from "react";
import type { Note } from "../lib/supabase";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

import toast from "react-hot-toast";

interface NoteListProps {
  notes: Note[];
  onSelectNote: (note: Note | null) => void;
  onCreateNote: () => Promise<void>;
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

  const handleCreateNote = async () => {
    try {
      await onCreateNote();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to create new note");
      }
    }
  };

  const handleSelectNote = (note: Note | null) => {
    try {
      onSelectNote(note);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to select note");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 text-center mb-4">
          Notes
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreateNote}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            New Note
          </button>
        </div>
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
              onClick={() => handleSelectNote(note)}
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
