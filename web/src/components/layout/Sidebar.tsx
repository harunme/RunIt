"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Rss,
  Brain,
  Send,
  FileText,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  {
    group: "Ingest",
    items: [
      { name: "Content", href: "/content", icon: FileText },
      { name: "Sources", href: "/sources", icon: Rss },
    ],
  },
  {
    group: "Process",
    items: [{ name: "Agents", href: "/agents", icon: Brain }],
  },
  {
    group: "Publish",
    items: [{ name: "Publishers", href: "/publishers", icon: Send }],
  },
  {
    group: "System",
    items: [{ name: "Settings", href: "/settings", icon: Settings }],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] bg-white border-r flex flex-col"
      style={{ borderColor: "var(--border-color)" }}
    >
      {/* Logo Area */}
      <div className="p-5 border-b" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" }}
          >
            R
          </div>
          <span
            className="text-xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" }}
          >
            RunIt
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map((group) => (
          <div key={group.group} className="mb-4">
            <div
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-sub)" }}
            >
              {group.group}
            </div>
            <ul className="space-y-0.5 px-2">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative"
                      style={{
                        backgroundColor: isActive ? "var(--primary-light)" : "transparent",
                        color: isActive ? "#EF4444" : "var(--text-main)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "#F9FAFB";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 rounded-lg"
                          style={{ backgroundColor: "var(--primary-light)" }}
                          transition={{ type: "spring", duration: 0.3 }}
                        />
                      )}
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="text-sm font-medium relative z-10">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
