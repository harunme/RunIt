"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { authApi, auth } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authApi.login(email, password);
      auth.setToken(result.access_token);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #FAFAFA, #F4F5F7)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-md p-8">
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #DC2626, #B91C1C)",
                }}
              >
                R
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
