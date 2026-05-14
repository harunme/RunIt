"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main
        className="flex-1 ml-[var(--sidebar-width)] p-10"
        style={{
          background: "linear-gradient(135deg, #FAFAFA 0%, #F4F5F7 100%)",
          minHeight: "100vh"
        }}
      >
        <div className="max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
