"use client";

import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import type { Note } from "./lib/supabase";
import { UserIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { useAuth } from "./context/AuthContext";
import Profile from "./components/Profile";
import NoteEditor from "./components/NoteEditor";
import NoteList from "./components/NoteList";
import {
  Menu,
  User,
  FileText,
  LogOut,
  Plus,
  Search,
  Gamepad2,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { user, signIn, signUp, signOut, error } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"notes" | "profile">("notes");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  useEffect(() => {
    const checkScreen = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const fetchNotes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        setNoteError("Failed to fetch notes. Please try again.");
        return;
      }

      setNotes(data || []);
      setNoteError(null);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNoteError("An unexpected error occurred. Please try again.");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Insert profile data
        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: data.user.id,
                full_name: fullName,
                date_of_birth: dateOfBirth,
              },
            ]);
          if (profileError) throw profileError;
        }
      }
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleSaveNote = async (
    title: string,
    content: string,
    isPublic: boolean
  ) => {
    if (!user) return;

    try {
      if (selectedNote) {
        const { error } = await supabase
          .from("notes")
          .update({
            title,
            content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", selectedNote.id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error updating note:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw error;
        }
      } else {
        console.log("Creating new note with data:", {
          title,
          content,
          user_id: user.id,
        });

        const { data, error } = await supabase
          .from("notes")
          .insert([
            {
              title,
              content,
              user_id: user.id,
            },
          ])
          .select()
          .single();

        if (error) {
          console.error("Error creating note:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          });
          throw error;
        }

        console.log("Note created successfully:", data);
      }

      await fetchNotes();
      setSelectedNote(null);
      // Close editor on small/medium screens after save
      if (!isLargeScreen) setEditorOpen(false);
    } catch (error: any) {
      console.error("Error saving note:", {
        name: error.name,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      setNoteError(error.message || "Failed to save note. Please try again.");
    }
  };

  const handleDeleteNote = async () => {
    if (!user || !selectedNote) return;

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", selectedNote.id)
        .eq("user_id", user.id);

      if (error) throw error;

      fetchNotes();
      setSelectedNote(null);
    } catch (error: any) {
      console.error("Error deleting note:", error);
      setNoteError("Failed to delete note. Please try again.");
    }
  };

  const handleShareNote = () => {
    if (!selectedNote) return;
    const url = `${window.location.origin}/note/${selectedNote.id}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
  };

  const handleCreateNote = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("notes")
        .insert([
          {
            title: "Untitled Note",
            content: "",
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (error) throw error;
      setNotes((prevNotes) => [data, ...prevNotes]);
      setSelectedNote(data);
      setActiveTab("notes");
      setEditorOpen(true); // Open editor on small/medium screens
    } catch (error: any) {
      console.error("Error creating note:", error);
      setNoteError("Failed to create new note. Please try again.");
    }
  };

  const handleSelectNote = (note: Note | null) => {
    setSelectedNote(note);
    setEditorOpen(true); // Open editor on small/medium screens
  };

  // Filter notes based on search query
  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900 flex items-center justify-center p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/90 to-zinc-800/80 border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-zinc-700/50">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                    <Gamepad2 className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Notenest
                </h2>
                <p className="mt-2 text-zinc-400">
                  {isLogin ? "Sign in to your account" : "Create a new account"}
                </p>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-4">
                  {!isLogin && (
                    <>
                      <div>
                        <label
                          htmlFor="fullName"
                          className="block text-sm font-medium text-zinc-300 mb-2">
                          Full Name
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-500 transition-all duration-200"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="dateOfBirth"
                          className="block text-sm font-medium text-zinc-300 mb-2">
                          Date of Birth
                        </label>
                        <input
                          id="dateOfBirth"
                          type="date"
                          required
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white transition-all duration-200"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-zinc-300 mb-2">
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-500 transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-zinc-300 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-500 transition-all duration-200"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{authError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg">
                  {isLogin ? "Sign in" : "Sign up"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setAuthError(null);
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200">
                    {isLogin
                      ? "Need an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900 flex flex-col">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Sticky Header */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-zinc-800/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg md:block hidden">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              {/* Hamburger for mobile */}
              <button
                className="md:hidden focus:outline-none"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu">
                <Menu className="h-6 w-6 text-zinc-400" />
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                Notenest
              </h1>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 transition-all duration-200">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-end md:hidden">
            <div className="w-64 bg-zinc-900 h-full shadow-xl flex flex-col p-6">
              <button
                className="self-end mb-6 text-zinc-400 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu">
                <span className="text-2xl">×</span>
              </button>
              <button
                className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-zinc-800 mb-2 font-medium"
                onClick={() => {
                  setActiveTab("notes");
                  setMobileMenuOpen(false);
                }}>
                Home
              </button>
              <button
                className="w-full text-left px-4 py-3 rounded-lg text-white hover:bg-zinc-800 mb-2 font-medium"
                onClick={() => {
                  setActiveTab("profile");
                  setEditorOpen(false);
                  setMobileMenuOpen(false);
                }}>
                Profile
              </button>
              <button
                className="w-full text-left px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/20 font-medium"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}>
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-4 lg:p-6 gap-6 relative">
        {/* Sidebar/Note List */}
        {(isLargeScreen || !editorOpen) && activeTab === "notes" && (
          <aside className="w-full lg:w-80 xl:w-96">
            <div className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/90 to-zinc-800/80 border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-4 border-b border-zinc-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-400" />
                    Your Notes
                  </h2>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search notes..."
                      className="px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-500 transition-all duration-200 w-36"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button
                      onClick={handleCreateNote}
                      className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                      <Plus className="h-4 w-4 mr-1" /> New
                    </button>
                  </div>
                </div>
              </div>
              {/* Notes List */}
              <div className="flex-1 overflow-y-auto p-4">
                <NoteList
                  notes={filteredNotes}
                  onSelectNote={handleSelectNote}
                  onCreateNote={handleCreateNote}
                />
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        {(isLargeScreen || editorOpen || activeTab === "profile") && (
          <section className="flex-1 flex flex-col gap-6">
            {/* Tab Navigation */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 gap-2 ${
                  activeTab === "notes"
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30 shadow-lg"
                    : "text-zinc-400 hover:text-white bg-zinc-800/30 hover:bg-zinc-700/50 border border-zinc-700/30"
                }`}>
                <FileText className="h-4 w-4" /> Notes
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center px-6 py-3 text-sm font-medium rounded-xl transition-all duration-200 gap-2 ${
                  activeTab === "profile"
                    ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/30 shadow-lg"
                    : "text-zinc-400 hover:text-white bg-zinc-800/30 hover:bg-zinc-700/50 border border-zinc-700/30"
                }`}>
                <User className="h-4 w-4" /> Profile
              </button>
            </div>

            {/* Main Content Area */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/90 to-zinc-800/80 border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden flex-1 min-h-[500px] flex flex-col">
              <div className="p-6 flex-1">
                {/* Status Messages */}
                {shareUrl && (
                  <div className="mx-6 mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-sm text-green-400">
                      📋 Note link copied to clipboard: {shareUrl}
                    </p>
                  </div>
                )}

                {noteError && (
                  <div className="mx-6 mb-6 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">⚠️ {noteError}</p>
                  </div>
                )}
                {activeTab === "notes" ? (
                  // Responsive: Only show editor if open on small/medium, always on large

                  isLargeScreen || editorOpen ? (
                    <div>
                      {/* Back button for small/medium screens */}
                      {!isLargeScreen && (
                        <button
                          onClick={() => setEditorOpen(false)}
                          className="mb-4 px-4 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-all">
                          ← Back to Notes
                        </button>
                      )}
                      <NoteEditor
                        note={selectedNote}
                        onSave={handleSaveNote}
                        onDelete={handleDeleteNote}
                        onShare={handleShareNote}
                      />
                    </div>
                  ) : (
                    // Show nothing or a placeholder on small/medium if editor not open
                    <div className="text-zinc-400 text-center mt-20">
                      Select or create a note to get started.
                    </div>
                  )
                ) : (
                  <Profile />
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
