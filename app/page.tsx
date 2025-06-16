"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import type { Note } from "./lib/supabase";
import { useAuth } from "./context/AuthContext";
import Profile from "./components/Profile";
import NoteEditor from "./components/NoteEditor";

import toast from "react-hot-toast";
import { Menu, FileText, Plus, Gamepad2, X, ArrowLeftIcon } from "lucide-react";
import Sidebar from "./components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

// Remove the interface since Next.js pages don't accept props by default
// If you need theme management, consider using a context or state management solution

function Home() {
  const { user, signIn, signOut, signUp } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"notes" | "profile">("notes");
  const [, setShareUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [, setEditorOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  const fetchNotes = useCallback(async () => {
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error fetching notes:", error);
        setNoteError("An unexpected error occurred. Please try again.");
      }
    }
  }, [user, setNoteError]); // Fixed: Added setNoteError to dependencies

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, fetchNotes]);

  useEffect(() => {
    const checkScreen = () => {
      const isLarge = window.innerWidth >= 768; // md breakpoint
      setIsLargeScreen(isLarge);
      // Close mobile menu when screen becomes large
      if (isLarge) {
        setMobileMenuOpen(false);
      }
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        if (user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                full_name: fullName,
                date_of_birth: dateOfBirth,
              },
            ]);
          if (profileError) throw profileError;
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) setAuthError(error.message);
    }
  };

  // Update the handleSaveNote function to handle creating new notes:
  const handleSaveNote = async (title: string, content: string) => {
    if (!user) return;
    try {
      if (selectedNote) {
        // Update existing note
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
          console.error("Error updating note:", error);
          throw error;
        }
        toast.success("Note updated successfully!");
      } else {
        // Create new note
        const { error } = await supabase.from("notes").insert([
          {
            title: title || "Untitled Note", // Use provided title or default
            content,
            user_id: user.id,
          },
        ]);
        if (error) {
          console.error("Error creating note:", error);
          throw error;
        }
        toast.success("Note created successfully!");
      }
      await fetchNotes();
      setSelectedNote(null);
      if (!isLargeScreen) setEditorOpen(false);
      setShowEditor(false); // Close editor after saving
    } catch (error: unknown) {
      if (error instanceof Error) {
        setNoteError(error.message || "Failed to save note. Please try again.");
      }
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
    } catch (error: unknown) {
      if (error instanceof Error)
        setNoteError("Failed to delete note. Please try again.");
    }
  };

  const handleShareNote = () => {
    if (!selectedNote) return;
    const url = `${window.location.origin}/note/${selectedNote.id}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
  };

  // Replace the handleCreateNote function with this simpler version:
  const handleCreateNote = () => {
    setSelectedNote(null); // Clear any selected note to create a new one
    setActiveTab("notes");
    setShowEditor(true);
    // Don't create the note in database yet - wait for save
  };

  const handleSelectNote = (note: Note | null) => {
    setSelectedNote(note);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedNote(null);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Filter notes based on search query

  if (!user) {
    return (
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-900 flex items-center justify-center p-4">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, -15, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              rotate: [0, 20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative w-full max-w-md">
          <div className="backdrop-blur-xl bg-gradient-to-br from-zinc-900/90 to-zinc-800/80 border border-zinc-700/50 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-zinc-700/50">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                    <Gamepad2 className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Notenest
                </motion.h2>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="mt-2 text-zinc-400">
                  {isLogin ? "Sign in to your account" : "Create a new account"}
                </motion.p>
              </div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="p-6">
              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-4">
                  {!isLogin && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-4">
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
                    </motion.div>
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

                <AnimatePresence>
                  {authError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{authError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-lg">
                  {isLogin ? "Sign in" : "Sign up"}
                </motion.button>

                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setAuthError(null);
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200">
                    {isLogin
                      ? "Need an account? Sign up"
                      : "Already have an account? Sign in"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      </motion.main>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 relative">
      {/* Mobile Menu Button */}
      {!isLargeScreen && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={toggleMobileMenu}
          className="fixed top-4 left-4 z-50 p-3 bg-zinc-800 text-white rounded-lg shadow-lg border border-zinc-700 hover:bg-zinc-700 transition-colors">
          <AnimatePresence mode="wait">
            {mobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}>
                <X className="h-6 w-6" />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}>
                <Menu className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {!isLargeScreen && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isLargeScreen || mobileMenuOpen) && (
          <motion.div
            initial={isLargeScreen ? false : { x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
              duration: 0.3,
            }}
            className={`${isLargeScreen ? "relative" : "fixed"} z-50 h-full`}>
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                if (!isLargeScreen) setMobileMenuOpen(false);
              }}
              onLogout={signOut}
              theme={theme}
              setTheme={setTheme}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`flex-1 p-4 md:p-8 overflow-y-auto ${
          !isLargeScreen ? "pt-20" : "ml-20"
        }`}>
        {/* Top bar with + New button (only on notes tab and when not editing) */}
        {activeTab === "notes" && !showEditor && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex justify-between items-center mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-zinc-100">
              Your Notes
            </h1>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateNote}
              className="flex items-center gap-2 px-4 md:px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-all">
              <Plus className="h-4 w-4 md:h-5 md:w-5" /> New
            </motion.button>
          </motion.div>
        )}

        {/* Display noteError if it exists */}
        {noteError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{noteError}</p>
          </motion.div>
        )}

        {/* Notes grid or editor */}
        {activeTab === "notes" && !showEditor && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <AnimatePresence>
              {notes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full text-center text-zinc-400">
                  No notes yet.
                </motion.div>
              ) : (
                notes.map((note, index) => (
                  <motion.button
                    key={note.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                    }}
                    whileHover={{
                      scale: 1.02,
                      transition: { duration: 0.2 },
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectNote(note)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-5 text-left shadow hover:shadow-lg hover:border-blue-500 transition-all group">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 md:h-5 md:w-5 text-blue-400" />
                      <span className="text-base md:text-lg font-semibold text-zinc-100 group-hover:text-blue-400 transition-all">
                        {note.title || "Untitled"}
                      </span>
                    </div>
                    <div className="text-zinc-400 text-sm line-clamp-3 mb-2">
                      {note.content || "No content"}
                    </div>
                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                      {new Date(note.updated_at).toLocaleDateString()}
                      {note.is_public && (
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Public
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Note editor (full width) */}
        <AnimatePresence>
          {activeTab === "notes" && showEditor && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCloseEditor}
                className="flex items-center gap-2 mb-6 px-4 py-2 bg-zinc-800 text-white rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-all">
                <ArrowLeftIcon className="h-4 w-4" /> Back
              </motion.button>
              <NoteEditor
                note={selectedNote}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
                onShare={handleShareNote}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile tab */}
        <AnimatePresence>
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto">
              <Profile />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}

export default Home;
