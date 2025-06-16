"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import {
  Edit3,
  Save,
  X,
  Trash2,
  User,
  Mail,
  Lock,
  AlertTriangle,
  Shield,
} from "lucide-react";

export default function Profile() {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoadingProfile(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, date_of_birth")
        .eq("id", user.id)
        .single();
      if (error) {
        setError("Failed to load profile data");
      } else {
        setFullName(data?.full_name || "");
        setDateOfBirth(data?.date_of_birth || "");
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (newEmail !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: newEmail,
        });
        if (emailError) throw emailError;
      }

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (passwordError) throw passwordError;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user?.id,
          full_name: fullName,
          date_of_birth: dateOfBirth || null,
        });
      if (profileError) throw profileError;

      setSuccess("Profile updated successfully");
      setIsEditing(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // First delete all user's notes
      const { error: notesError } = await supabase
        .from("notes")
        .delete()
        .eq("user_id", user?.id);

      if (notesError) throw notesError;

      // Then delete the user account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        user?.id || ""
      );

      if (deleteError) throw deleteError;

      await signOut();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-6 rounded-xl border border-zinc-700/30 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Profile Settings
              </h2>
              <p className="text-zinc-400 text-sm">
                Manage your account settings and preferences
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            <p className="text-green-400 text-sm font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {loadingProfile ? (
          <div className="text-zinc-400">Loading profile...</div>
        ) : isEditing ? (
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Full Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <User className="h-4 w-4 text-blue-400" />
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-500 transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>
            {/* Date of Birth Field */}
            <div className="space-y-2">
              <label
                htmlFor="dateOfBirth"
                className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <User className="h-4 w-4 text-blue-400" />
                Date of Birth
              </label>
              <input
                type="date"
                id="dateOfBirth"
                value={dateOfBirth || ""}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-500 transition-all duration-200"
                placeholder="YYYY-MM-DD"
              />
            </div>
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Mail className="h-4 w-4 text-blue-400" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-500 transition-all duration-200"
                placeholder="Enter your email address"
              />
            </div>

            {/* Password Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Lock className="h-4 w-4 text-blue-400" />
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-500 transition-all duration-200"
                  placeholder="Enter new password (leave blank to keep current)"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Lock className="h-4 w-4 text-blue-400" />
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-zinc-500 transition-all duration-200"
                  placeholder="Confirm your new password"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setError(null);
                  setSuccess(null);
                  setNewEmail(user?.email || "");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="flex items-center gap-2 px-6 py-3 text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 rounded-lg transition-all duration-200">
                <X className="h-4 w-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Account Information */}
            <div className="bg-zinc-800/30 border border-zinc-700/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                Account Information
              </h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Full Name</p>
                    <p className="text-white font-medium">{fullName || <span className="text-zinc-500">Not set</span>}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Mail className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Email Address</p>
                    <p className="text-white font-medium">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Date of Birth</p>
                    <p className="text-white font-medium">{dateOfBirth ? dateOfBirth : <span className="text-zinc-500">Not set</span>}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <User className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Account Status</p>
                    <p className="text-green-400 font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </h3>
              <p className="text-zinc-400 text-sm mb-4">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>

              <button
                onClick={() => setIsDeleting(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg transition-all duration-200">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Delete Account</h3>
            </div>

            <p className="text-zinc-300 mb-6">
              This action cannot be undone. All your notes will be permanently
              deleted and you will lose access to your account.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-6 py-3 text-zinc-300 hover:text-white bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/50 rounded-lg transition-all duration-200">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
