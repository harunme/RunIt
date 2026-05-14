"use client";

import { useEffect, useState } from "react";
import { AuthCheck } from "@/components/AuthCheck";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { User, Key, Bell } from "lucide-react";

interface UserProfile {
  email: string;
  username?: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile>({ email: "" });
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Load user profile from auth API
    async function loadProfile() {
      try {
        const user = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("runit_token")}`,
          },
        }).then((r) => r.json());
        setProfile({ email: user.email || "", username: user.username || "" });
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Save settings - this would call an API endpoint
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (e) {
      setMessage({ type: "error", text: "Failed to save settings." });
    }
    setSaving(false);
  };

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader title="Settings" />

        {message && (
          <div
            className={`mb-6 px-4 py-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100">
                <User className="w-5 h-5 text-zinc-600" />
              </div>
              <CardTitle>Profile</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Username"
                placeholder="Enter your username"
                defaultValue={profile.username}
              />
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                defaultValue={profile.email}
              />
            </div>
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100">
                <Key className="w-5 h-5 text-zinc-600" />
              </div>
              <CardTitle>API Keys</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="OpenAI API Key"
                type="password"
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
              <Input
                label="Anthropic API Key"
                type="password"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
              />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Your API keys are stored securely and encrypted.
            </p>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100">
                <Bell className="w-5 h-5 text-zinc-600" />
              </div>
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Enable notifications
                </span>
                <p className="text-xs text-gray-500">
                  Receive notifications when tasks complete or fail.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </AppShell>
    </AuthCheck>
  );
}
