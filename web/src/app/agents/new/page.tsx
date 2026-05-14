"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgentForm } from "@/components/AgentForm";
import { AuthCheck } from "@/components/AuthCheck";

export default function NewAgentPage() {
  return (
    <AuthCheck>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/agents" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">New Agent</h1>
        </div>
        <AgentForm />
      </main>
    </AuthCheck>
  );
}
