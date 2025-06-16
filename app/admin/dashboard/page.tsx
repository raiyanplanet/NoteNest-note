"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import type { Note } from "@/app/lib/supabase";

type User = {
  id: string;
  email: string;
  created_at: string;
  full_name?: string;
  date_of_birth?: string;
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, []);

  const checkAdmin = () => {
    console.log("Checking admin status...");
    const adminCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("admin="));

    console.log("Admin cookie:", adminCookie);

    if (!adminCookie) {
      console.log("No admin cookie found, redirecting to login");
      window.location.href = "/admin/login";
      return;
    }

    try {
      const adminData = JSON.parse(
        decodeURIComponent(adminCookie.split("=")[1])
      );
      console.log("Admin data:", adminData);

      if (!adminData.isAdmin) {
        console.log("Not an admin, redirecting to login");
        window.location.href = "/admin/login";
      }
    } catch (error) {
      console.error("Error parsing admin cookie:", error);
      window.location.href = "/admin/login";
    }
  };

  const fetchData = async () => {
    try {
      // Fetch users from the API route
      const res = await fetch("/api/admin-users");
      const usersJson = await res.json();
      if (usersJson.error) throw new Error(usersJson.error);
      const usersData = usersJson.users;
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, date_of_birth");
      if (profilesError) throw profilesError;
      // Merge user and profile data
      const transformedUsers = usersData.map((user: { id: string; email: string | null; created_at: string }) => {
        const profile = (profiles.find((p: { id: string; full_name: string | null; date_of_birth: string | null }) => p.id === user.id)) || { full_name: null, date_of_birth: null };
        return {
          id: user.id,
          email: user.email || "",
          created_at: user.created_at,
          full_name: profile.full_name || "",
          date_of_birth: profile.date_of_birth || "",
        };
      });
      setUsers(transformedUsers);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .select("*");

      if (notesError) {
        console.error("Error fetching notes:", notesError);
        throw notesError;
      }
      setNotes(notesData || []);
    } catch (error: unknown) {
      if (error instanceof Error) setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This will also delete all their notes."
      )
    )
      return;

    try {
      const res = await fetch("/api/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete user");
      setUsers(users.filter((user) => user.id !== userId));
      setNotes(notes.filter((note) => note.user_id !== userId));
    } catch (error: unknown) {
      if (error instanceof Error) setError(error.message);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error } = await supabase.from("notes").delete().eq("id", noteId);

      if (error) throw error;
      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error deleting note:", error.message);
        setError(error.message);
      }
    }
  };

  const handleSignOut = () => {
    document.cookie = "admin=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/admin/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-zinc-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <nav className="bg-white dark:bg-zinc-900 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleSignOut}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-zinc-900 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Users Section */}
          <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-4">
              Users ({users.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Full Name
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Date of Birth
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-right text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-zinc-100">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-zinc-100">
                        {user.full_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                        {user.date_of_birth}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-zinc-100 mb-4">
              Notes ({notes.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-left text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 bg-gray-50 dark:bg-zinc-800 text-right text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
                  {notes.map((note) => (
                    <tr key={note.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-zinc-100">
                        {note.title || "Untitled"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                        {users.find((u) => u.id === note.user_id)?.email ||
                          "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-zinc-400">
                        {new Date(note.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
 