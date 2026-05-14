# RunIt Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign RunIt's frontend with RedInk visual style, workflow-based navigation, and rich micro-interactions.

**Architecture:** Build design system foundation first (CSS variables, layout shell), then reusable UI components, then feature components, finally update all pages. Use Framer Motion for animations.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS 4, Framer Motion 12, Lucide React

---

## File Inventory

### New Files to Create

```
web/src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx               # Main layout wrapper with sidebar
│   │   ├── Sidebar.tsx                # Navigation sidebar
│   │   └── PageHeader.tsx             # Page title + actions wrapper
│   ├── ui/
│   │   ├── Button.tsx                 # Button with variants
│   │   ├── Input.tsx                  # Text input component
│   │   ├── Select.tsx                 # Dropdown select
│   │   ├── Badge.tsx                  # Status badge
│   │   ├── Card.tsx                   # Base card wrapper
│   │   ├── Modal.tsx                  # Modal dialog
│   │   ├── Drawer.tsx                 # Slide-out panel
│   │   ├── EmptyState.tsx             # Empty state display
│   │   └── LoadingSkeleton.tsx        # Loading placeholder
│   └── features/
│       ├── StatCard.tsx               # Dashboard stat card
│       ├── ModuleCard.tsx             # Module navigation card
│       ├── ListItem.tsx               # List row with hover
│       └── ActivityFeed.tsx            # Recent activity list
```

### Files to Modify

```
web/src/
├── app/
│   ├── globals.css                     # Extend with design tokens
│   ├── layout.tsx                     # Use AppShell, add fonts
│   ├── page.tsx                       # Dashboard redesign
│   ├── sources/page.tsx               # Sources list redesign
│   ├── sources/[id]/page.tsx          # Source detail redesign
│   ├── sources/new/page.tsx           # Source create (use Drawer)
│   ├── agents/page.tsx                # Agents list redesign
│   ├── agents/[id]/page.tsx           # Agent detail redesign
│   ├── agents/new/page.tsx            # Agent create (use Drawer)
│   ├── publishers/page.tsx            # Publishers list redesign
│   ├── publishers/[id]/page.tsx       # Publisher detail redesign
│   ├── publishers/new/page.tsx         # Publisher create (use Drawer)
│   ├── content/page.tsx               # Content page redesign
│   ├── tasks/page.tsx                 # Tasks page (new)
│   ├── settings/page.tsx              # Settings page redesign
│   └── login/page.tsx                 # Login page refresh
├── components/
│   ├── AuthCheck.tsx                  # Update to use AppShell
│   └── SourceForm.tsx                 # Update for Drawer variant
└── lib/
    └── api.ts                         # Add content.list() if missing
```

---

## Phase 1: Design System Foundation

### Task 1: CSS Variables and Global Styles

**Files:**
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Update globals.css with design tokens**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Primary - Soft Red */
  --primary: #FF2442;
  --primary-hover: #E61E3A;
  --primary-light: rgba(255, 36, 66, 0.08);
  
  /* Backgrounds */
  --bg-body: #F4F5F7;
  --bg-sidebar: #FFFFFF;
  --bg-card: #FFFFFF;
  
  /* Text */
  --text-main: #1a1a1a;
  --text-sub: #666666;
  --text-placeholder: #999999;
  
  /* Borders */
  --border-color: #EEEEEE;
  
  /* Status */
  --success: #52C41A;
  --warning: #FA8C16;
  --error: #FF4D4F;
  
  /* Spacing */
  --sidebar-width: 200px;
  
  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.12);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Utility classes */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.6s ease-out;
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat: add design system CSS variables and animations"
```

---

### Task 2: Layout Components

**Files:**
- Create: `web/src/components/layout/AppShell.tsx`
- Create: `web/src/components/layout/Sidebar.tsx`
- Create: `web/src/components/layout/PageHeader.tsx`

- [ ] **Step 1: Create AppShell.tsx**

```tsx
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
```

- [ ] **Step 2: Create Sidebar.tsx**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Rss, 
  Brain, 
  Send, 
  FileText, 
  CheckSquare,
  Settings 
} from "lucide-react";
import { motion } from "framer-motion";

const navigationGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    title: "Ingest",
    items: [
      { name: "Sources", href: "/sources", icon: Rss },
    ],
  },
  {
    title: "Process",
    items: [
      { name: "Agents", href: "/agents", icon: Brain },
    ],
  },
  {
    title: "Publish",
    items: [
      { name: "Publishers", href: "/publishers", icon: Send },
    ],
  },
  {
    title: "Review",
    items: [
      { name: "Content", href: "/content", icon: FileText },
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside 
      className="fixed left-0 top-0 h-screen w-[var(--sidebar-width)] bg-white border-r border-[var(--border-color)] p-8 flex flex-col z-50"
    >
      {/* Logo */}
      <div className="mb-12">
        <div 
          className="w-[150px] h-10 rounded-lg flex items-center justify-center font-bold text-lg"
          style={{ 
            background: "linear-gradient(135deg, #FF2442, #FF4D4F)",
            color: "white"
          }}
        >
          RunIt
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {navigationGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <div className="text-xs font-semibold text-[var(--text-placeholder)] uppercase tracking-wider mb-2 px-2">
              {group.title}
            </div>
            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-[15px]
                      transition-all duration-200 relative
                      ${active 
                        ? "bg-[var(--primary-light)] text-[var(--primary)]" 
                        : "text-[var(--text-sub)] hover:bg-[#F9FAFB] hover:text-[var(--primary)]"
                      }
                    `}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeNav"
                        className="w-1 h-6 bg-[var(--primary)] rounded-full absolute left-0"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 3: Create PageHeader.tsx**

```tsx
"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <motion.div 
      className="mb-8 flex justify-between items-end flex-wrap gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-[36px] font-extrabold tracking-tight mb-3" style={{ color: "var(--text-main)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg" style={{ color: "var(--text-sub)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </motion.div>
  );
}
```

- [ ] **Step 4: Update layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunIt - Content Aggregator",
  description: "AI-powered content aggregation and social media publishing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/layout/AppShell.tsx web/src/components/layout/Sidebar.tsx web/src/components/layout/PageHeader.tsx web/src/app/layout.tsx
git commit -m "feat: add layout components (AppShell, Sidebar, PageHeader)"
```

---

### Task 3: UI Components - Button, Input, Badge, Card

**Files:**
- Create: `web/src/components/ui/Button.tsx`
- Create: `web/src/components/ui/Input.tsx`
- Create: `web/src/components/ui/Badge.tsx`
- Create: `web/src/components/ui/Card.tsx`

- [ ] **Step 1: Create Button.tsx**

```tsx
"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary: "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] hover:shadow-lg hover:shadow-[var(--primary)]/20 active:scale-[0.98]",
  secondary: "bg-[#F5F5F5] text-[var(--text-main)] hover:bg-[#EEEEEE] active:scale-[0.98]",
  ghost: "bg-transparent text-[var(--text-sub)] hover:bg-[#F9FAFB] hover:text-[var(--text-main)]",
  danger: "bg-[var(--error)] text-white hover:opacity-90 active:scale-[0.98]",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading = false, disabled, children, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={clsx(
          "inline-flex items-center justify-center gap-2 font-semibold rounded-lg",
          "transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
```

- [ ] **Step 2: Create Input.tsx**

```tsx
"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium mb-2" style={{ color: "var(--text-main)" }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            "w-full px-4 py-3 text-[15px] rounded-lg",
            "border border-[var(--border-color)] bg-white",
            "text-[var(--text-main)] placeholder:text-[var(--text-placeholder)]",
            "transition-all duration-200",
            "focus:outline-none focus:border-[var(--primary)]",
            "focus:shadow-[0_0_0_3px_var(--primary-light)]",
            error && "border-[var(--error)]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm" style={{ color: "var(--error)" }}>{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
```

- [ ] **Step 3: Create Badge.tsx**

```tsx
"use client";

import { ReactNode } from "react";
import { clsx } from "clsx";

interface BadgeProps {
  variant?: "success" | "warning" | "error" | "neutral" | "primary";
  children: ReactNode;
  className?: string;
}

const variants = {
  success: "bg-[#F6FFED] text-[#52C41A]",
  warning: "bg-[#FFF7E6] text-[#FA8C16]",
  error: "bg-[#FFF2F0] text-[#FF4D4F]",
  neutral: "bg-[#F5F5F5] text-[#666666]",
  primary: "bg-[var(--primary-light)] text-[var(--primary)]",
};

export function Badge({ variant = "neutral", children, className }: BadgeProps) {
  return (
    <span className={clsx("inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full", variants[variant], className)}>
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Create Card.tsx**

```tsx
"use client";

import { HTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingSizes = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, padding = "md", children, ...props }, ref) => {
    const Component = hoverable ? motion.div : "div";
    const motionProps = hoverable ? { whileHover: { y: -4, boxShadow: "var(--shadow-md)" }, transition: { duration: 0.2 } } : {};

    return (
      <Component
        ref={ref}
        className={clsx(
          "bg-white rounded-2xl shadow-sm border border-[var(--border-color)]",
          paddingSizes[padding],
          hoverable && "cursor-pointer transition-shadow duration-200",
          className
        )}
        {...motionProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/ui/Button.tsx web/src/components/ui/Input.tsx web/src/components/ui/Badge.tsx web/src/components/ui/Card.tsx
git commit -m "feat: add UI components (Button, Input, Badge, Card)"
```

---

### Task 4: UI Components - Modal, Drawer, EmptyState, LoadingSkeleton, Select

**Files:**
- Create: `web/src/components/ui/Modal.tsx`
- Create: `web/src/components/ui/Drawer.tsx`
- Create: `web/src/components/ui/EmptyState.tsx`
- Create: `web/src/components/ui/LoadingSkeleton.tsx`
- Create: `web/src/components/ui/Select.tsx`

- [ ] **Step 1: Create Modal.tsx**

```tsx
"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={clsx("relative bg-white rounded-2xl shadow-xl w-full z-10 overflow-hidden", sizes[size])}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
                <h2 className="text-lg font-bold" style={{ color: "var(--text-main)" }}>{title}</h2>
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F9FAFB]"><X className="w-5 h-5" style={{ color: "var(--text-sub)" }} /></button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Create Drawer.tsx**

```tsx
"use client";

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number;
}

export function Drawer({ open, onClose, title, children, width = 480 }: DrawerProps) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/50" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            style={{ width }}
            className="absolute right-0 top-0 h-full bg-white shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-main)" }}>{title}</h2>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#F9FAFB]"><X className="w-5 h-5" style={{ color: "var(--text-sub)" }} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Create EmptyState.tsx**

```tsx
"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-[#F5F5F5] flex items-center justify-center mb-6" style={{ color: "var(--text-placeholder)" }}>
          {icon}
        </motion.div>
      )}
      <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-main)" }}>{title}</h3>
      {description && <p className="text-sm mb-6 max-w-xs" style={{ color: "var(--text-sub)" }}>{description}</p>}
      {action && <Button onClick={action.onClick}>{action.label}</Button>}
    </motion.div>
  );
}
```

- [ ] **Step 4: Create LoadingSkeleton.tsx**

```tsx
"use client";

import { clsx } from "clsx";

interface SkeletonProps { className?: string; }

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={clsx("animate-pulse rounded-lg bg-gradient-to-r from-[#F5F5F5] via-[#EEEEEE] to-[#F5F5F5] bg-[length:200%_100%]", className)} style={{ animation: "shimmer 1.5s infinite" }} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-[var(--border-color)]">
      <Skeleton className="h-5 w-32 mb-4" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-5 bg-[#F9FAFB] rounded-xl">
      <Skeleton className="w-11 h-11 rounded-xl" />
      <div className="flex-1">
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-48" />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create Select.tsx**

```tsx
"use client";

import { SelectHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && <label htmlFor={selectId} className="block text-sm font-medium mb-2" style={{ color: "var(--text-main)" }}>{label}</label>}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={clsx(
              "w-full px-4 py-3 text-[15px] rounded-lg appearance-none",
              "border border-[var(--border-color)] bg-white",
              "text-[var(--text-main)]",
              "transition-all duration-200",
              "focus:outline-none focus:border-[var(--primary)]",
              "focus:shadow-[0_0_0_3px_var(--primary-light)]",
              error && "border-[var(--error)]",
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: "var(--text-placeholder)" }} />
        </div>
        {error && <p className="mt-1 text-sm" style={{ color: "var(--error)" }}>{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
```

- [ ] **Step 6: Commit**

```bash
git add web/src/components/ui/Modal.tsx web/src/components/ui/Drawer.tsx web/src/components/ui/EmptyState.tsx web/src/components/ui/LoadingSkeleton.tsx web/src/components/ui/Select.tsx
git commit -m "feat: add UI components (Modal, Drawer, EmptyState, Skeleton, Select)"
```

---

## Phase 2: Feature Components

### Task 5: StatCard, ModuleCard, ListItem, ActivityFeed

**Files:**
- Create: `web/src/components/features/StatCard.tsx`
- Create: `web/src/components/features/ModuleCard.tsx`
- Create: `web/src/components/features/ListItem.tsx`
- Create: `web/src/components/features/ActivityFeed.tsx`

- [ ] **Step 1: Create StatCard.tsx**

```tsx
"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  delay?: number;
}

export function StatCard({ title, value, icon: Icon, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      className="bg-white rounded-xl p-5 shadow-sm border border-[var(--border-color)] transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && <span className="text-xs font-semibold" style={{ color: trend.isPositive ? "var(--success)" : "var(--error)" }}>{trend.isPositive ? "+" : ""}{trend.value}%</span>}
      </div>
      <div className="text-[32px] font-extrabold leading-none mb-1" style={{ color: "var(--text-main)" }}>{value}</div>
      <div className="text-[13px]" style={{ color: "var(--text-sub)" }}>{title}</div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create ModuleCard.tsx**

```tsx
"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface ModuleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color?: "red" | "pink" | "orange" | "green" | "blue" | "purple";
  delay?: number;
}

const colorVariants = {
  red: { bg: "#FFF0F0", icon: "#FF4D4F" },
  pink: { bg: "#FFF0F6", icon: "#EB2F96" },
  orange: { bg: "#FFF7E6", icon: "#FA8C16" },
  green: { bg: "#F6FFED", icon: "#52C41A" },
  blue: { bg: "#E6F7FF", icon: "#1890FF" },
  purple: { bg: "#F9F0FF", icon: "#722ED1" },
};

export function ModuleCard({ title, description, icon: Icon, href, color = "blue", delay = 0 }: ModuleCardProps) {
  const colors = colorVariants[color];

  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ y: -4, borderColor: "var(--primary)" }}
        className="bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent cursor-pointer h-full"
      >
        <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }} className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: colors.bg }}>
          <Icon className="w-7 h-7" style={{ color: colors.icon }} />
        </motion.div>
        <h3 className="font-bold text-base mb-1.5" style={{ color: "var(--text-main)" }}>{title}</h3>
        <p className="text-[13px]" style={{ color: "var(--text-sub)" }}>{description}</p>
      </motion.div>
    </Link>
  );
}
```

- [ ] **Step 3: Create ListItem.tsx**

```tsx
"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface ListItemProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  onClick?: () => void;
  href?: string;
}

export function ListItem({ icon: Icon, iconColor = "var(--text-sub)", title, subtitle, badge, onClick, href }: ListItemProps) {
  const content = (
    <motion.div
      whileHover={{ x: 4 }}
      className={clsx("flex items-center gap-4 p-5 bg-[#F9FAFB] rounded-xl cursor-pointer", "border border-transparent", "hover:bg-white hover:border-[var(--border-color)]", "hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]", "transition-all duration-200 group")}
      onClick={onClick}
    >
      <motion.div whileHover={{ color: "var(--primary)", borderColor: "rgba(255, 36, 66, 0.2)", background: "#FFF0F2" }} className="w-11 h-11 rounded-xl bg-white flex items-center justify-center border border-black/[0.04]" style={{ color: iconColor }}>
        <Icon className="w-5 h-5" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] truncate" style={{ color: "var(--text-main)" }}>{title}</div>
        {subtitle && <div className="text-[12px] truncate" style={{ color: "var(--text-sub)" }}>{subtitle}</div>}
      </div>
      {badge && <div>{badge}</div>}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--primary)" }}>
        <ChevronRight className="w-5 h-5" />
      </div>
    </motion.div>
  );

  if (href) return <a href={href} style={{ textDecoration: "none" }}>{content}</a>;
  return content;
}
```

- [ ] **Step 4: Create ActivityFeed.tsx**

```tsx
"use client";

import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Clock, LucideIcon } from "lucide-react";

interface Activity {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  description?: string;
  timestamp: string;
}

interface ActivityFeedProps { activities: Activity[]; }

const typeConfig = {
  success: { icon: CheckCircle, color: "#52C41A", bg: "#F6FFED" },
  warning: { icon: AlertCircle, color: "#FA8C16", bg: "#FFF7E6" },
  error: { icon: AlertCircle, color: "#FF4D4F", bg: "#FFF2F0" },
  info: { icon: Clock, color: "#1890FF", bg: "#E6F7FF" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="flex flex-col gap-3">
      {activities.map((activity, index) => {
        const config = typeConfig[activity.type];
        const Icon = config.icon;
        
        return (
          <motion.div key={activity.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-start gap-3 p-4 bg-[#F9FAFB] rounded-xl">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: config.bg, color: config.color }}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm" style={{ color: "var(--text-main)" }}>{activity.title}</div>
              {activity.description && <div className="text-xs mt-0.5" style={{ color: "var(--text-sub)" }}>{activity.description}</div>}
            </div>
            <div className="text-xs flex-shrink-0" style={{ color: "var(--text-placeholder)" }}>{activity.timestamp}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add web/src/components/features/StatCard.tsx web/src/components/features/ModuleCard.tsx web/src/components/features/ListItem.tsx web/src/components/features/ActivityFeed.tsx
git commit -m "feat: add feature components (StatCard, ModuleCard, ListItem, ActivityFeed)"
```

---

## Phase 3: Page Updates

### Task 6: Dashboard and AuthCheck

**Files:**
- Modify: `web/src/app/page.tsx`
- Modify: `web/src/components/AuthCheck.tsx`

- [ ] **Step 1: Update AuthCheck.tsx**

```tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/api";

interface AuthCheckProps { children: ReactNode; }

export function AuthCheck({ children }: AuthCheckProps) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!auth.isLoggedIn()) {
      router.push("/login");
    } else {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Create new Dashboard page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Rss, Brain, Send, CheckSquare } from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/features/StatCard";
import { ModuleCard } from "@/components/features/ModuleCard";
import { ActivityFeed } from "@/components/features/ActivityFeed";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AuthCheck } from "@/components/AuthCheck";

interface Stats { sources: number; tasks: number; providers: number; publishers: number; }

interface Activity {
  id: string;
  type: "success" | "warning" | "error" | "info";
  title: string;
  description?: string;
  timestamp: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ sources: 0, tasks: 0, providers: 0, publishers: 0 });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sources, tasks, providers, publishers] = await Promise.all([
          api.sources.list().catch(() => []),
          api.tasks.list({ page_size: 5 }).catch(() => ({ items: [], total: 0 })),
          api.llm.list().catch(() => []),
          api.publishers.list().catch(() => []),
        ]);

        setStats({
          sources: Array.isArray(sources) ? sources.length : 0,
          tasks: tasks?.total || 0,
          providers: Array.isArray(providers) ? providers.length : 0,
          publishers: Array.isArray(publishers) ? publishers.length : 0,
        });

        const taskItems = tasks?.items || [];
        const recentActivities: Activity[] = taskItems.slice(0, 5).map((task: any) => ({
          id: task.id,
          type: task.status === "completed" ? "success" : task.status === "failed" ? "error" : "info",
          title: `Task ${task.status}`,
          description: task.source_name || task.agent_name,
          timestamp: task.created_at ? formatTimeAgo(task.created_at) : "Just now",
        }));

        if (recentActivities.length === 0) {
          recentActivities.push({ id: "1", type: "info", title: "No recent tasks", description: "Run a source to see activity here", timestamp: "—" });
        }

        setActivities(recentActivities);
      } catch (e) { console.error("Failed to load data:", e); }
      finally { setLoading(false); }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      </AppShell>
    );
  }

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader title="Dashboard" subtitle="Overview of your content aggregation pipeline" />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Sources" value={stats.sources} icon={Rss} delay={0} />
          <StatCard title="Tasks" value={stats.tasks} icon={CheckSquare} delay={0.1} />
          <StatCard title="LLM Providers" value={stats.providers} icon={Brain} delay={0.2} />
          <StatCard title="Publishers" value={stats.publishers} icon={Send} delay={0.3} />
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <ModuleCard title="Content" description="View collected content" icon={CheckSquare} href="/content" color="blue" delay={0.1} />
          <ModuleCard title="Sources" description="Configure data sources" icon={Rss} href="/sources" color="green" delay={0.15} />
          <ModuleCard title="Agents" description="AI processing strategies" icon={Brain} href="/agents" color="purple" delay={0.2} />
          <ModuleCard title="Publishers" description="Social media platforms" icon={Send} href="/publishers" color="orange" delay={0.25} />
          <ModuleCard title="Settings" description="System configuration" icon={CheckSquare} href="/settings" color="red" delay={0.3} />
        </div>

        {/* Recent Activity */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-main)" }}>Recent Activity</h2>
          </div>
          <ActivityFeed activities={activities} />
        </Card>
      </AppShell>
    </AuthCheck>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/page.tsx web/src/components/AuthCheck.tsx
git commit -m "feat: redesign dashboard with new layout and components"
```

---

### Task 7: Sources List Page

**Files:**
- Modify: `web/src/app/sources/page.tsx`
- Modify: `web/src/components/SourceForm.tsx`

- [ ] **Step 1: Create new Sources page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Rss, Github, Twitter, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { ListItem } from "@/components/features/ListItem";
import { SourceForm } from "@/components/SourceForm";
import { Drawer } from "@/components/ui/Drawer";
import { AuthCheck } from "@/components/AuthCheck";

interface Source {
  id: string; name: string; type: string; config: any; schedule: string; enabled: boolean; last_run_at: string | null;
}

const typeIcons: Record<string, any> = { github: Github, twitter: Twitter, rss: Rss };

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { loadSources(); }, []);

  async function loadSources() {
    try {
      const data = await api.sources.list();
      setSources(data);
    } catch (e) { console.error("Failed to load sources:", e); }
    finally { setLoading(false); }
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Delete this source?")) return;
    try { await api.sources.delete(id); setSources(sources.filter((s) => s.id !== id)); }
    catch (err) { console.error("Failed to delete:", err); }
  };

  const handleSourceCreated = (newSource: Source) => { setSources([...sources, newSource]); setDrawerOpen(false); };

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader title="Sources" subtitle="Configure data sources to aggregate content" actions={<Button onClick={() => setDrawerOpen(true}><Plus className="w-4 h-4" />Add Source</Button>} />

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <ListItemSkeleton key={i} />)}</div>
        ) : sources.length === 0 ? (
          <Card><EmptyState icon={<Rss className="w-8 h-8" />} title="No sources configured" description="Add your first data source to start collecting content" action={{ label: "Add Source", onClick: () => setDrawerOpen(true) }} /></Card>
        ) : (
          <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
            {sources.map((source) => (
              <motion.div key={source.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                <ListItem icon={typeIcons[source.type] || Rss} iconColor={source.enabled ? "var(--primary)" : "var(--text-placeholder)"} title={source.name} subtitle={`${source.type} • ${source.schedule}`} badge={<Badge variant={source.enabled ? "success" : "neutral"}>{source.enabled ? "Active" : "Disabled"}</Badge>} href={`/sources/${source.id}`} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Add Source">
          <SourceForm onSuccess={handleSourceCreated} onCancel={() => setDrawerOpen(false)} />
        </Drawer>
      </AppShell>
    </AuthCheck>
  );
}
```

- [ ] **Step 2: Update SourceForm for Drawer**

```tsx
"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

interface SourceFormProps {
  onSuccess: (source: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const sourceTypes = [
  { value: "rss", label: "RSS Feed" },
  { value: "github", label: "GitHub" },
  { value: "twitter", label: "Twitter" },
];

const schedules = [
  { value: "*/15 * * * *", label: "Every 15 minutes" },
  { value: "*/30 * * * *", label: "Every 30 minutes" },
  { value: "0 * * * *", label: "Every hour" },
  { value: "0 0 * * *", label: "Daily" },
];

export function SourceForm({ onSuccess, onCancel, initialData }: SourceFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    type: initialData?.type || "rss",
    url: initialData?.config?.url || "",
    schedule: initialData?.schedule || "*/30 * * * *",
    enabled: initialData?.enabled ?? true,
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    if (!formData.name.trim()) { setError("Name is required"); return; }
    if (!formData.url.trim()) { setError("URL is required"); return; }

    setLoading(true);
    try {
      const payload = { name: formData.name, type: formData.type, config: { url: formData.url }, schedule: formData.schedule, enabled: formData.enabled };
      let result;
      if (initialData?.id) { result = await api.sources.update(initialData.id, payload); }
      else { result = await api.sources.create(payload); }
      onSuccess(result);
    } catch (err: any) { setError(err.message || "Failed to save source"); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input label="Name" placeholder="My RSS Feed" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
      <Select label="Type" options={sourceTypes} value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} />
      <Input label="URL" placeholder="https://example.com/feed.xml" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} />
      <Select label="Schedule" options={schedules} value={formData.schedule} onChange={(e) => setFormData({ ...formData, schedule: e.target.value })} />
      {error && <p className="text-sm" style={{ color: "var(--error)" }}>{error}</p>}
      <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button type="submit" loading={loading} className="flex-1">{initialData ? "Update" : "Create"}</Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/sources/page.tsx web/src/components/SourceForm.tsx
git commit -m "feat: redesign sources list page with drawer form"
```

---

### Task 8: Agents and Publishers Pages

**Files:**
- Modify: `web/src/app/agents/page.tsx`
- Modify: `web/src/app/publishers/page.tsx`

- [ ] **Step 1: Create new Agents page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { ListItem } from "@/components/features/ListItem";
import { AuthCheck } from "@/components/AuthCheck";

interface Agent { id: string; name: string; source_type: string; llm_provider_id: string | null; output_format: string; }

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [agentsData, providersData] = await Promise.all([api.agents.list(), api.llm.list().catch(() => [])]);
        setAgents(agentsData); setProviders(providersData);
      } catch (e) { console.error("Failed to load:", e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Delete this agent?")) return;
    try { await api.agents.delete(id); setAgents(agents.filter((a) => a.id !== id)); }
    catch (e) { console.error("Failed to delete:", e); }
  };

  const getProviderName = (id: string | null) => { if (!id) return "None"; const provider = providers.find((p) => p.id === id); return provider?.name || id; };

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader title="Agents" subtitle="AI processing strategies for content transformation" actions={<Link href="/agents/new"><Button><Plus className="w-4 h-4" />Add Agent</Button></Link>} />

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <ListItemSkeleton key={i} />)}</div>
        ) : agents.length === 0 ? (
          <Card><EmptyState icon={<Brain className="w-8 h-8" />} title="No agents configured" description="Create your first AI agent to process content" action={{ label: "Add Agent", onClick: () => window.location.href = "/agents/new" }} /></Card>
        ) : (
          <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
            {agents.map((agent) => (
              <motion.div key={agent.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                <ListItem icon={Brain} title={agent.name} subtitle={`${agent.source_type} • ${getProviderName(agent.llm_provider_id)}`} badge={<button onClick={(e) => handleDelete(e, agent.id)} className="p-2 rounded-lg hover:bg-[#FFF2F0] text-[var(--error)] transition-colors"><Trash2 className="w-4 h-4" /></button>} href={`/agents/${agent.id}`} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AppShell>
    </AuthCheck>
  );
}
```

- [ ] **Step 2: Create new Publishers page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Send, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { ListItem } from "@/components/features/ListItem";
import { AuthCheck } from "@/components/AuthCheck";

interface Publisher { id: string; name: string; platform: string; config: any; enabled: boolean; }

export default function PublishersPage() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try { const data = await api.publishers.list(); setPublishers(data); }
      catch (e) { console.error("Failed to load:", e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirm("Delete this publisher?")) return;
    try { await api.publishers.delete(id); setPublishers(publishers.filter((p) => p.id !== id)); }
    catch (e) { console.error("Failed to delete:", e); }
  };

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader title="Publishers" subtitle="Configure social media platforms for content publishing" actions={<Link href="/publishers/new"><Button><Plus className="w-4 h-4" />Add Publisher</Button></Link>} />

        {loading ? (
          <div className="space-y-4">{[1, 2, 3].map((i) => <ListItemSkeleton key={i} />)}</div>
        ) : publishers.length === 0 ? (
          <Card><EmptyState icon={<Send className="w-8 h-8" />} title="No publishers configured" description="Add your first publisher to start sharing content" action={{ label: "Add Publisher", onClick: () => window.location.href = "/publishers/new" }} /></Card>
        ) : (
          <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
            {publishers.map((publisher) => (
              <motion.div key={publisher.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                <ListItem icon={Send} title={publisher.name} subtitle={publisher.platform} badge={<button onClick={(e) => handleDelete(e, publisher.id)} className="p-2 rounded-lg hover:bg-[#FFF2F0] text-[var(--error)] transition-colors"><Trash2 className="w-4 h-4" /></button>} href={`/publishers/${publisher.id}`} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AppShell>
    </AuthCheck>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/app/agents/page.tsx web/src/app/publishers/page.tsx
git commit -m "feat: redesign agents and publishers pages"
```

---

### Task 9: Content, Tasks, and Settings Pages

**Files:**
- Modify: `web/src/app/content/page.tsx`
- Create: `web/src/app/tasks/page.tsx`
- Modify: `web/src/app/settings/page.tsx`

- [ ] **Step 1: Create Content page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { ListItem } from "@/components/features/ListItem";
import { AuthCheck } from "@/components/AuthCheck";

interface Content { id: string; title: string; source_name: string; created_at: string; url?: string; }

export default function ContentPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try { const data = await api.content?.list ? await api.content.list() : []; setContents(data); }
      catch (e) { console.error("Failed to load:", e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader title="Content" subtitle="View collected and processed content" />

        {loading ? (
          <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <ListItemSkeleton key={i} />)}</div>
        ) : contents.length === 0 ? (
          <Card><EmptyState icon={<FileText className="w-8 h-8" />} title="No content yet" description="Content will appear here once sources collect it" /></Card>
        ) : (
          <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
            {contents.map((item) => (
              <motion.div key={item.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                <ListItem icon={FileText} title={item.title} subtitle={`From ${item.source_name} • ${formatDate(item.created_at)}`} href={item.url} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AppShell>
    </AuthCheck>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
```

- [ ] **Step 2: Create Tasks page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Clock, CheckCircle, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";
import { ListItem } from "@/components/features/ListItem";
import { AuthCheck } from "@/components/AuthCheck";

interface Task { id: string; source_name?: string; agent_name?: string; status: "pending" | "running" | "completed" | "failed"; created_at: string; }

const statusConfig = {
  pending: { icon: Clock, color: "neutral", label: "Pending" },
  running: { icon: Clock, color: "warning", label: "Running" },
  completed: { icon: CheckCircle, color: "success", label: "Completed" },
  failed: { icon: XCircle, color: "error", label: "Failed" },
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try { const data = await api.tasks.list({ page_size: 50 }); setTasks(data.items || []); }
      catch (e) { console.error("Failed to load:", e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader title="Tasks" subtitle="Monitor task execution history" />

        {loading ? (
          <div className="space-y-4">{[1, 2, 3, 4, 5].map((i) => <ListItemSkeleton key={i} />)}</div>
        ) : tasks.length === 0 ? (
          <Card><EmptyState icon={<CheckSquare className="w-8 h-8" />} title="No tasks yet" description="Tasks will appear here when sources run" /></Card>
        ) : (
          <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}>
            {tasks.map((task) => {
              const config = statusConfig[task.status];
              return (
                <motion.div key={task.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
                  <ListItem icon={config.icon} iconColor={task.status === "completed" ? "var(--success)" : task.status === "failed" ? "var(--error)" : "var(--text-sub)"} title={task.source_name || task.agent_name || "Task"} subtitle={formatTimeAgo(task.created_at)} badge={<Badge variant={config.color as any}>{config.label}</Badge>} />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AppShell>
    </AuthCheck>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString); const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
```

- [ ] **Step 3: Create Settings page**

```tsx
"use client";

import { useState } from "react";
import { User, Key, Bell } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { AuthCheck } from "@/components/AuthCheck";

export default function SettingsPage() {
  const [settings, setSettings] = useState({ username: "", email: "", openaiKey: "", anthropicKey: "", notifications: true });

  const handleSave = () => { alert("Settings saved!"); };

  return (
    <AuthCheck>
      <AppShell>
        <PageHeader title="Settings" subtitle="Configure your RunIt preferences" actions={<Button onClick={handleSave}>Save Changes</Button>} />

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--primary-light)", color: "var(--primary)" }}><User className="w-5 h-5" /></div>
              <div><h2 className="font-bold" style={{ color: "var(--text-main)" }}>Profile</h2><p className="text-sm" style={{ color: "var(--text-sub)" }}>Your account information</p></div>
            </div>
            <div className="space-y-4">
              <Input label="Username" value={settings.username} onChange={(e) => setSettings({ ...settings, username: e.target.value })} placeholder="Your username" />
              <Input label="Email" type="email" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} placeholder="you@example.com" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F6FFED", color: "#52C41A" }}><Key className="w-5 h-5" /></div>
              <div><h2 className="font-bold" style={{ color: "var(--text-main)" }}>API Keys</h2><p className="text-sm" style={{ color: "var(--text-sub)" }}>Configure your AI provider keys</p></div>
            </div>
            <div className="space-y-4">
              <Input label="OpenAI API Key" type="password" value={settings.openaiKey} onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })} placeholder="sk-..." />
              <Input label="Anthropic API Key" type="password" value={settings.anthropicKey} onChange={(e) => setSettings({ ...settings, anthropicKey: e.target.value })} placeholder="sk-ant-..." />
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#FFF7E6", color: "#FA8C16" }}><Bell className="w-5 h-5" /></div>
              <div><h2 className="font-bold" style={{ color: "var(--text-main)" }}>Notifications</h2><p className="text-sm" style={{ color: "var(--text-sub)" }}>Manage notification preferences</p></div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })} className="w-5 h-5 rounded border-[var(--border-color)] accent-[var(--primary)]" />
              <span style={{ color: "var(--text-main)" }}>Enable email notifications</span>
            </label>
          </Card>
        </div>
      </AppShell>
    </AuthCheck>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add web/src/app/content/page.tsx web/src/app/tasks/page.tsx web/src/app/settings/page.tsx
git commit -m "feat: add remaining pages (content, tasks, settings)"
```

---

### Task 10: Login Page Refresh

**Files:**
- Modify: `web/src/app/login/page.tsx`

- [ ] **Step 1: Update Login page**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      await auth.login(email, password);
      router.push("/");
    } catch (err: any) { setError(err.message || "Invalid credentials"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #FAFAFA 0%, #F4F5F7 100%)" }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block w-[60px] h-[60px] rounded-xl flex items-center justify-center font-bold text-xl text-white mb-4" style={{ background: "linear-gradient(135deg, #FF2442, #FF4D4F)" }}>R</div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text-main)" }}>Welcome back</h1>
          <p style={{ color: "var(--text-sub)" }}>Sign in to your RunIt account</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-sm text-center" style={{ color: "var(--error)" }}>{error}</p>}
            <Button type="submit" loading={loading} className="w-full">Sign In</Button>
          </form>
          <div className="mt-6 text-center">
            <p style={{ color: "var(--text-sub)" }}>Don&apos;t have an account? <Link href="/register" className="font-semibold" style={{ color: "var(--primary)" }}>Sign up</Link></p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/login/page.tsx
git commit -m "feat: refresh login page with new design"
```

---

## Phase 4: Detail Pages

### Task 11: Source Detail Page

**Files:**
- Modify: `web/src/app/sources/[id]/page.tsx`

- [ ] **Step 1: Create Source Detail page**

```tsx
"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Play, Trash2, Edit } from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ListItem } from "@/components/features/ListItem";
import { SourceForm } from "@/components/SourceForm";
import { Drawer } from "@/components/ui/Drawer";
import { AuthCheck } from "@/components/AuthCheck";

interface Source { id: string; name: string; type: string; config: any; schedule: string; enabled: boolean; last_run_at: string | null; created_at: string; }
interface Task { id: string; status: string; created_at: string; }

export default function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [source, setSource] = useState<Source | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningSource, setRunningSource] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const [sourceData, tasksData] = await Promise.all([api.sources.get(id), api.tasks.list({ source_id: id, page_size: 10 }).catch(() => ({ items: [] }))]);
      setSource(sourceData); setTasks(tasksData.items || []);
    } catch (e) { console.error("Failed to load source:", e); }
    finally { setLoading(false); }
  }

  const handleRun = async () => {
    setRunningSource(true);
    try { await api.sources.run(id); await loadData(); }
    catch (e) { console.error("Failed to run source:", e); }
    finally { setRunningSource(false); }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this source? This cannot be undone.")) return;
    try { await api.sources.delete(id); window.location.href = "/sources"; }
    catch (e) { console.error("Failed to delete:", e); }
  };

  const handleSourceUpdated = (updated: Source) => { setSource(updated); setDrawerOpen(false); };

  if (loading) {
    return (<AppShell><div className="flex items-center justify-center min-h-[400px]"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} /></div></AppShell>);
  }

  if (!source) {
    return (<AppShell><div className="text-center py-12"><p style={{ color: "var(--text-sub)" }}>Source not found</p><Link href="/sources"><Button variant="secondary" className="mt-4">Back to Sources</Button></Link></div></AppShell>);
  }

  return (
    <AuthCheck>
      <AppShell>
        <Link href="/sources" className="inline-flex items-center gap-2 text-sm mb-4" style={{ color: "var(--text-sub)" }}><ArrowLeft className="w-4 h-4" />Back to Sources</Link>
        <PageHeader title={source.name} subtitle={`${source.type} • ${source.schedule}`} actions={<div className="flex items-center gap-2"><Button variant="secondary" onClick={() => setDrawerOpen(true)}><Edit className="w-4 h-4" />Edit</Button><Button variant="secondary" onClick={handleRun} loading={runningSource}><Play className="w-4 h-4" />Run Now</Button><Button variant="danger" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button></div>} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="font-bold mb-4" style={{ color: "var(--text-main)" }}>Configuration</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]"><span style={{ color: "var(--text-sub)" }}>Status</span><Badge variant={source.enabled ? "success" : "neutral"}>{source.enabled ? "Active" : "Disabled"}</Badge></div>
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]"><span style={{ color: "var(--text-sub)" }}>Type</span><span style={{ color: "var(--text-main)" }}>{source.type}</span></div>
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]"><span style={{ color: "var(--text-sub)" }}>URL</span><span style={{ color: "var(--text-main)" }} className="max-w-[300px] truncate">{source.config?.url || "—"}</span></div>
                <div className="flex justify-between py-2"><span style={{ color: "var(--text-sub)" }}>Last Run</span><span style={{ color: "var(--text-main)" }}>{source.last_run_at ? formatDate(source.last_run_at) : "Never"}</span></div>
              </div>
            </Card>
            <Card>
              <h3 className="font-bold mb-4" style={{ color: "var(--text-main)" }}>Recent Tasks</h3>
              {tasks.length === 0 ? <p style={{ color: "var(--text-placeholder)" }}>No tasks yet</p> : <div className="space-y-2">{tasks.map((task) => <ListItem key={task.id} icon={Play} iconColor={task.status === "completed" ? "var(--success)" : "var(--text-sub)"} title={`Task ${task.status}`} subtitle={formatDate(task.created_at)} />)}</div>}
            </Card>
          </div>
          <div className="space-y-6">
            <Card><h3 className="font-bold mb-4" style={{ color: "var(--text-main)" }}>Details</h3><div className="space-y-3"><div><p className="text-xs mb-1" style={{ color: "var(--text-placeholder)" }}>Created</p><p style={{ color: "var(--text-main)" }}>{formatDate(source.created_at)}</p></div><div><p className="text-xs mb-1" style={{ color: "var(--text-placeholder)" }}>ID</p><p className="text-sm font-mono" style={{ color: "var(--text-sub)" }}>{source.id}</p></div></div></Card>
          </div>
        </div>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Edit Source"><SourceForm initialData={source} onSuccess={handleSourceUpdated} onCancel={() => setDrawerOpen(false)} /></Drawer>
      </AppShell>
    </AuthCheck>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/app/sources/[id]/page.tsx
git commit -m "feat: add source detail page with edit drawer"
```

---

## Final Verification

- [ ] **Step 1: Run dev server**

```bash
cd web && npm run dev
```

- [ ] **Step 2: Verify all pages render correctly**

- Dashboard shows stats and module cards
- Sidebar navigation works with workflow groups
- Sources list loads and shows items
- Create source drawer works
- Detail pages load with data

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete frontend redesign with RedInk styling"
```

---

## Verification Checklist

- [ ] All pages accessible from sidebar navigation
- [ ] Stats cards display correct data
- [ ] List pages load and display items
- [ ] Detail pages show configuration
- [ ] Create/edit forms work in drawers
- [ ] Loading states shown during data fetch
- [ ] Empty states shown when no data
- [ ] Animations smooth (60fps)
- [ ] No console errors
