import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Trash2,
  Share2,
  Eye,
  EyeOff,
  Check,
  Edit3,
  Clock,
  FileText,
  Sparkles,
  Heart,
  Moon,
  Sun,
} from "lucide-react";

// Mock types for demonstration
interface Note {
  id: string;
  title: string;
  content: string;
  is_public: boolean;
  updated_at: string;
}

interface NoteEditorProps {
  note?: Note | null;
  onSave?: (title: string, content: string, isPublic: boolean) => Promise<void>;
  onDelete?: () => Promise<void>;
  onShare?: () => void;
}

export default function NoteEditor({
  note = null,
  onSave = async () => {},
  onDelete = async () => {},
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Character counts
  const titleCharCount = title.length;
  const contentCharCount = content.length;
  const contentWordCount = content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content || "");
      setIsPublic(note.is_public || false);
      setLastSaved(note.updated_at ? new Date(note.updated_at) : null);
      setHasUnsavedChanges(false);
    } else {
      setTitle("");
      setContent("");
      setIsPublic(false);
      setLastSaved(null);
      setHasUnsavedChanges(false);
    }
  }, [note]);

  // Track unsaved changes
  useEffect(() => {
    if (note) {
      const hasChanges =
        title !== (note.title || "") ||
        content !== (note.content || "") ||
        isPublic !== (note.is_public || false);
      setHasUnsavedChanges(hasChanges);
    } else {
      setHasUnsavedChanges(
        title.trim().length > 0 || content.trim().length > 0
      );
    }
  }, [title, content, isPublic, note]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      return;
    }

    if (!content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(title.trim(), content.trim(), isPublic);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setIsSaving(false);
    }
  }, [title, content, isPublic, onSave]);

  const handleDelete = useCallback(async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this note? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete]);

  const handleShare = useCallback(() => {
    if (!note) return;

    const url = `${window.location.origin}/note/${note.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setShareUrlCopied(true);
        setTimeout(() => setShareUrlCopied(false), 2000);
      })
      .catch(() => {
        console.error("Failed to copy to clipboard");
      });
  }, [note]);

  const handleTogglePublic = useCallback(async () => {
    if (!note) return;

    try {
      const newPublicState = !isPublic;
      setIsPublic(newPublicState);
    } catch (error) {
      console.error("Toggle visibility error:", error);
    }
  }, [note, isPublic]);

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`min-h-screen transition-all duration-500  ${
        isDarkMode
          ? "dark bg-gradient-to-br from-gray-900 via-zinc-900 to-gray-900"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
      }`}>
      <div className="max-w-5xl mx-auto">
        {/* Floating Header */}
        <div
          className={`backdrop-blur-xl rounded-2xl border shadow-2xl mb-6 transition-all duration-300 hover:shadow-3xl ${
            isDarkMode
              ? "bg-gray-800/80 border-gray-700/50"
              : "bg-white/80 border-white/50"
          }`}>
          <div className="px-8 py-6 max-md:px-3">
            <div className="flex flex-col items-start justify-between gap-3">
              <div className="flex items-center space-x-4">
                <div
                  className={`p-3 max-md:p-2 rounded-xl transition-all duration-300 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-purple-600 to-blue-600"
                      : "bg-gradient-to-r from-blue-500 to-purple-500"
                  } shadow-lg`}>
                  <Edit3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-2xl font-bold max-md:text-xl ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    } transition-colors`}>
                    {note ? "✨ Edit Note" : "🚀 New Note"}
                  </h1>
                  {lastSaved && (
                    <div
                      className={`flex items-center text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      } mt-1`}>
                      <Clock className="h-4 w-4 mr-2" />
                      Last saved {formatLastSaved(lastSaved)}
                    </div>
                  )}
                </div>
              </div>
              {/* top button */}
              <div className="flex items-center space-x-3">
                {/* Dark Mode Toggle */}
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-3 max-md:p-2 rounded-xl transition-all duration-300 ${
                    isDarkMode
                      ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } hover:scale-105 active:scale-95`}>
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>

                {note && (
                  <button
                    onClick={handleTogglePublic}
                    className={` hidden items-center px-4 py-3 max-md:py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                      isPublic
                        ? isDarkMode
                          ? "text-emerald-400 bg-emerald-500/20 hover:bg-emerald-500/30 shadow-emerald-500/25"
                          : "text-emerald-700 bg-emerald-100 hover:bg-emerald-200 shadow-emerald-200"
                        : isDarkMode
                        ? "text-gray-300 bg-gray-700/50 hover:bg-gray-700"
                        : "text-gray-700 bg-gray-100 hover:bg-gray-200 shadow-gray-200"
                    } shadow-lg`}>
                    {isPublic ? (
                      <Eye className="h-4 w-4 mr-2" />
                    ) : (
                      <EyeOff className="h-4 w-4 mr-2" />
                    )}
                    {isPublic ? "Public" : "Private"}
                  </button>
                )}

                {note && (
                  <button
                    onClick={handleShare}
                    className={`flex items-center px-4 py-3 max-md:py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                      isDarkMode
                        ? "text-blue-400 bg-blue-500/20 hover:bg-blue-500/30"
                        : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                    } shadow-lg`}>
                    {shareUrlCopied ? (
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <Share2 className="h-4 w-4 mr-2" />
                    )}
                    Share
                  </button>
                )}

                {note && (
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`flex items-center px-4 py-3 max-md:py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                      isDarkMode
                        ? "text-red-400 bg-red-500/20 hover:bg-red-500/30"
                        : "text-red-700 bg-red-100 hover:bg-red-200"
                    } shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}>
                    <Trash2
                      className={`h-4 w-4 mr-2 ${
                        isDeleting ? "animate-pulse" : ""
                      }`}
                    />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}

                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className={`flex items-center px-6 max-md:py-2 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg max-md:px-3 ${
                    hasUnsavedChanges
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-blue-500/25"
                      : isDarkMode
                      ? "bg-gray-700 text-gray-400"
                      : "bg-gray-200 text-gray-500"
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}>
                  <Save
                    className={`h-4 w-4 mr-2 ${isSaving ? "animate-spin" : ""}`}
                  />
                  {isSaving
                    ? "Saving..."
                    : hasUnsavedChanges
                    ? "Save"
                    : "Saved"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Editor Container */}
        <div
          className={`backdrop-blur-xl rounded-2xl border shadow-2xl transition-all duration-300 ${
            isDarkMode
              ? "bg-gray-800/80 border-gray-700/50"
              : "bg-white/80 border-white/50"
          }`}>
          <div className="p-8 max-md:p-3 space-y-8">
            {/* Title Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="note-title"
                  className={`text-sm font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  } transition-colors`}>
                  ✍️ Title
                </label>
                <div
                  className={`flex items-center space-x-2 text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                  <Sparkles className="h-3 w-3" />
                  <span>{titleCharCount}/100</span>
                </div>
              </div>
              <div
                className={`relative transition-all duration-300 ${
                  focusedField === "title" ? "transform scale-[1.01]" : ""
                }`}>
                <input
                  id="note-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onFocus={() => setFocusedField("title")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your brilliant note title..."
                  maxLength={100}
                  className={`w-full text-2xl font-bold px-6 py-4 max-md:py-2 max-md:px-3 rounded-xl border-2 transition-all duration-300 ${
                    focusedField === "title"
                      ? isDarkMode
                        ? "border-purple-500 bg-gray-700/50 shadow-purple-500/25"
                        : "border-blue-500 bg-blue-50/50 shadow-blue-500/25"
                      : isDarkMode
                      ? "border-gray-600 bg-gray-700/30"
                      : "border-gray-200 bg-gray-50/50"
                  } ${
                    isDarkMode
                      ? "text-white placeholder-gray-400"
                      : "text-gray-900 placeholder-gray-500"
                  } focus:outline-none shadow-lg`}
                />
                <div
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-300 ${
                    title ? "opacity-0" : "opacity-30"
                  }`}>
                  <Edit3
                    className={`h-6 w-6 ${
                      isDarkMode ? "text-gray-600" : "text-gray-400"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="note-content"
                  className={`text-sm font-semibold ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  } transition-colors`}>
                  📝 Content
                </label>
                <div
                  className={`flex items-center space-x-4 text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                  <div className="flex items-center space-x-1">
                    <Heart className="h-3 w-3" />
                    <span>{contentWordCount} words</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-3 w-3" />
                    <span>{contentCharCount} chars</span>
                  </div>
                </div>
              </div>
              <div
                className={`relative transition-all duration-300 ${
                  focusedField === "content" ? "transform scale-[1.005]" : ""
                }`}>
                <textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onFocus={() => setFocusedField("content")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Start writing your amazing thoughts here... ✨"
                  rows={20}
                  className={`w-full px-6 py-6 max-md:py-3 max-md:px-3 rounded-xl border-2 transition-all duration-300 resize-none leading-relaxed text-lg ${
                    focusedField === "content"
                      ? isDarkMode
                        ? "border-purple-500 bg-gray-700/50 shadow-purple-500/25"
                        : "border-blue-500 bg-blue-50/50 shadow-blue-500/25"
                      : isDarkMode
                      ? "border-gray-600 bg-gray-700/30"
                      : "border-gray-200 bg-gray-50/50"
                  } ${
                    isDarkMode
                      ? "text-white placeholder-gray-400"
                      : "text-gray-900 placeholder-gray-500"
                  } focus:outline-none shadow-lg`}
                />
                <div
                  className={`absolute bottom-6 right-6 transition-opacity duration-300 ${
                    content ? "opacity-0" : "opacity-20"
                  }`}>
                  <FileText
                    className={`h-8 w-8 ${
                      isDarkMode ? "text-gray-600" : "text-gray-400"
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          {hasUnsavedChanges && (
            <div
              className={`px-8 py-4 border-t rounded-b-2xl transition-all duration-300 ${
                isDarkMode
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-amber-50 border-amber-200"
              }`}>
              <div className="flex items-center justify-between">
                <div
                  className={`flex items-center text-sm font-medium ${
                    isDarkMode ? "text-amber-400" : "text-amber-700"
                  }`}>
                  <div className="w-2 h-2 bg-amber-500 rounded-full mr-3 animate-pulse"></div>
                  <Sparkles className="h-4 w-4 mr-2" />
                  You have unsaved changes
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 px-4 py-2 rounded-lg ${
                    isDarkMode
                      ? "text-amber-400 hover:text-amber-300 bg-amber-500/20 hover:bg-amber-500/30"
                      : "text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200"
                  }`}>
                  Save now ✨
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Stats */}
        <div className={`mt-6 grid grid-cols-1 md:grid-cols-3 gap-4`}>
          <div
            className={`backdrop-blur-xl rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? "bg-gray-800/60 border-gray-700/50"
                : "bg-white/60 border-white/50"
            } shadow-lg`}>
            <div
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
              Words
            </div>
            <div
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
              {contentWordCount.toLocaleString()}
            </div>
          </div>

          <div
            className={`backdrop-blur-xl rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? "bg-gray-800/60 border-gray-700/50"
                : "bg-white/60 border-white/50"
            } shadow-lg`}>
            <div
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
              Characters
            </div>
            <div
              className={`text-2xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>
              {contentCharCount.toLocaleString()}
            </div>
          </div>

          <div
            className={`backdrop-blur-xl rounded-xl p-4 border transition-all duration-300 hover:scale-105 ${
              isDarkMode
                ? "bg-gray-800/60 border-gray-700/50"
                : "bg-white/60 border-white/50"
            } shadow-lg`}>
            <div
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>
              Status
            </div>
            <div
              className={`text-2xl font-bold ${
                hasUnsavedChanges
                  ? "text-amber-500"
                  : isDarkMode
                  ? "text-emerald-400"
                  : "text-emerald-600"
              }`}>
              {hasUnsavedChanges ? "✏️ Draft" : "✅ Saved"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
