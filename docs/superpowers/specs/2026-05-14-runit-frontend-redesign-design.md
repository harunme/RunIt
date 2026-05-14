# RunIt Frontend Redesign Specification

**Date:** 2026-05-14
**Reference:** RedInk Project (https://github.com/HisMax/RedInk)
**Status:** Draft

---

## Overview

Redesign RunIt's frontend using RedInk's visual design language while restructuring the information architecture around a workflow-based organization. The result will be a cohesive, modern interface with rich micro-interactions.

---

## Design System

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#FF2442` | Primary actions, active states, accents |
| `--primary-hover` | `#E61E3A` | Primary hover state |
| `--primary-light` | `rgba(255, 36, 66, 0.08)` | Light primary backgrounds |
| `--bg-body` | `#F4F5F7` | Page background |
| `--bg-sidebar` | `#FFFFFF` | Sidebar background |
| `--bg-card` | `#FFFFFF` | Card backgrounds |
| `--text-main` | `#1a1a1a` | Primary text |
| `--text-sub` | `#666666` | Secondary text |
| `--text-placeholder` | `#999999` | Placeholder text |
| `--border-color` | `#EEEEEE` | Borders and dividers |
| `--success` | `#52C41A` | Success states |
| `--warning` | `#FA8C16` | Warning states |
| `--error` | `#FF4D4F` | Error states |

### Typography

- **Font Family:** `Inter` (via Google Fonts), fallback: `-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif`
- **Weights:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extra bold)
- **Scale:**
  - Page title: 36px, weight 800, letter-spacing -1px
  - Section title: 20px, weight 700
  - Card title: 16px, weight 700
  - Body: 15px, weight 400
  - Caption: 12px, weight 400

### Spacing System

- Base unit: 8px
- Common spacing: 8, 12, 16, 20, 24, 32, 40, 48px
- Card padding: 24px
- Section gap: 24px
- Sidebar padding: 32px 24px

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Buttons, inputs, small cards |
| `--radius-md` | 12px | Medium cards, list items |
| `--radius-lg` | 16px | Large cards, modals |

### Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 2px 8px rgba(0,0,0,0.06)` | Small elevation |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Medium elevation |
| `--shadow-lg` | `0 8px 30px rgba(0,0,0,0.12)` | Large elevation, focus states |

### Animations

- Base duration: 200ms (micro), 300ms (standard), 600ms (page-level)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Keyframe: `fadeIn`, `slideUp`, `slideInRight`

---

## Layout Architecture

### Shell Structure

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (200px fixed)  │  MAIN CONTENT (flex: 1)     │
│                         │                               │
│  ┌─────────────────┐   │  ┌─────────────────────────┐  │
│  │  Logo/Brand     │   │  │  Page Header            │  │
│  └─────────────────┘   │  └─────────────────────────┘  │
│                         │                               │
│  ┌─────────────────┐   │  ┌─────────────────────────┐  │
│  │  Navigation     │   │  │  Page Content           │  │
│  │  - Dashboard    │   │  │                         │  │
│  │  - Ingest       │   │  │                         │  │
│  │    - Sources    │   │  │                         │  │
│  │  - Process      │   │  │                         │  │
│  │    - Agents    │   │  │                         │  │
│  │  - Publish      │   │  │                         │  │
│  │    - Publishers│   │  │                         │  │
│  │  - Review       │   │  │                         │  │
│  │    - Content   │   │  │                         │  │
│  │    - Tasks     │   │  │                         │  │
│  │  - Settings    │   │  └─────────────────────────┘  │
│  └─────────────────┘   │                               │
└─────────────────────────────────────────────────────────┘
```

### Sidebar Design

- Width: 200px
- Position: Fixed left
- Background: `--bg-sidebar`
- Border: 1px solid `--border-color` on right
- Logo area: 200px width, 40px logo icon, 48px bottom margin
- Navigation groups with collapsible sections
- Active item: `--primary-light` background, `--primary` text
- Hover: `#F9FAFB` background

### Main Content Area

- Background: Linear gradient `135deg, #FAFAFA 0%, #F4F5F7 100%`
- Padding: 40px 60px
- Max content width: 1200px

---

## Navigation Structure

### Sidebar Navigation Groups

1. **Overview**
   - Dashboard

2. **Ingest** (collect data)
   - Sources

3. **Process** (AI processing)
   - Agents

4. **Publish** (distribution)
   - Publishers

5. **Review** (monitoring)
   - Content
   - Tasks

6. **System**
   - Settings

### Navigation Item Design

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: var(--radius-md);
  color: var(--text-sub);
  font-weight: 500;
  font-size: 15px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background: #F9FAFB;
  color: var(--primary);
}

.nav-item.active {
  background: var(--primary-light);
  color: var(--primary);
}
```

---

## Page Templates

### Dashboard Page

- Page title: "Dashboard" with subtitle showing last sync time
- Stats grid: 4-column grid showing Sources, Tasks, Providers, Publishers counts
- Recent Activity section: List of recent task completions
- Quick Actions: Cards for common actions (Add Source, Create Agent, etc.)
- Animations: Staggered fade-in on load, hover lift on cards

### List Pages (Sources, Agents, Publishers)

- Page header: Title + primary action button (right-aligned)
- Filter bar: Search input + status filter dropdown
- Card list: Vertical stack of cards with hover effects
- Empty state: Illustration + call-to-action button
- Pagination: Bottom-aligned if needed

### Detail Pages

- Breadcrumb navigation
- Page title with status badge
- Action toolbar: Edit, Delete, Run (for sources)
- Tabbed content: Overview, Configuration, History
- Activity log section

### Form Pages (Modal variant for simple forms)

- Slide-in panel from right (480px width)
- Header with title + close button
- Form content with labeled fields
- Footer with Cancel + Submit buttons
- Loading state on submit
- Success animation on completion

---

## Component Library

### StatCard

```css
.stat-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-main);
}

.stat-label {
  font-size: 13px;
  color: var(--text-sub);
  margin-top: 4px;
}
```

### ModuleCard

```css
.module-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.module-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-light);
}

.module-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.module-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 6px;
}

.module-desc {
  font-size: 13px;
  color: var(--text-sub);
}
```

### ListItem

```css
.list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #F9FAFB;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.list-item:hover {
  background: white;
  border-color: var(--border-color);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transform: translateY(-1px);
}

.list-item-icon {
  width: 44px;
  height: 44px;
  background: white;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0,0,0,0.04);
  transition: all 0.2s;
}

.list-item:hover .list-item-icon {
  color: var(--primary);
  border-color: rgba(255, 36, 66, 0.2);
  background: #FFF0F2;
}
```

### Button

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 36, 66, 0.2);
}

.btn-secondary {
  background: #F5F5F5;
  color: var(--text-main);
}

.btn-secondary:hover {
  background: #EEEEEE;
}
```

### Input

```css
.input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: white;
  color: var(--text-main);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}

.input::placeholder {
  color: var(--text-placeholder);
}
```

### Modal/Drawer

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: var(--radius-lg);
  max-width: 560px;
  width: 90%;
  max-height: 90vh;
  overflow: auto;
  animation: slideUp 0.3s ease;
}

.drawer-panel {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 480px;
  background: white;
  box-shadow: -4px 0 20px rgba(0,0,0,0.1);
  z-index: 1000;
  animation: slideInRight 0.3s ease;
}
```

### Badge

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 100px;
}

.badge-success {
  background: #F6FFED;
  color: #52C41A;
}

.badge-warning {
  background: #FFF7E6;
  color: #FA8C16;
}

.badge-error {
  background: #FFF2F0;
  color: #FF4D4F;
}

.badge-neutral {
  background: #F5F5F5;
  color: #666666;
}
```

### EmptyState

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: var(--text-placeholder);
}

.empty-state-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

.empty-state-desc {
  font-size: 14px;
  color: var(--text-sub);
  margin-bottom: 24px;
  max-width: 320px;
}
```

### LoadingSkeleton

```css
.skeleton {
  background: linear-gradient(
    90deg,
    #F5F5F5 25%,
    #EEEEEE 50%,
    #F5F5F5 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

---

## Micro-Interactions

### Page Transitions

- Fade in page content on mount (600ms)
- Stagger child elements (100ms delay between items)

### Hover Effects

- Cards: translateY(-4px) + shadow increase
- List items: background change + subtle lift
- Buttons: translateY(-1px) + shadow
- Icons: scale(1.1) on parent hover

### Feedback Animations

- Success: Checkmark scale-in with bounce
- Error: Shake animation
- Loading: Pulse or spinner
- Toast notifications: Slide in from top-right

### Drag & Drop (for list reordering)

- Lift item on drag start
- Drop zone highlight
- Smooth reorder animation

---

## Responsive Behavior

### Breakpoints

- Desktop: > 1024px — Full sidebar visible
- Tablet: 768px - 1024px — Collapsed sidebar (icons only, 72px)
- Mobile: < 768px — Hidden sidebar, hamburger menu

### Mobile Adaptations

- Sidebar becomes slide-out drawer
- Stats grid: 2 columns
- Module cards: Stack vertically
- Tables: Horizontal scroll or card view

---

## Implementation Phases

### Phase 1: Design System Foundation
- CSS variables and base styles
- Global layout component (AppShell with sidebar)
- Core components: Button, Input, Badge, Card
- Animation keyframes and utilities

### Phase 2: Page Shell
- Sidebar navigation with workflow groups
- Dashboard page with stats
- Global header and breadcrumbs

### Phase 3: List Pages
- Sources list with filtering
- Agents list with filtering
- Publishers list with filtering
- Content/Tasks pages
- Settings page

### Phase 4: Detail & Forms
- Source detail page with tabs
- Agent detail page with tabs
- Publisher detail page with tabs
- Modal forms for create/edit
- Success/error feedback

### Phase 5: Polish
- Loading skeletons
- Empty states with illustrations
- Toast notifications
- Page transitions
- Responsive refinements

---

## File Structure

```
web/src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Dashboard
│   ├── globals.css          # Global styles + CSS variables
│   ├── sources/
│   ├── agents/
│   ├── publishers/
│   ├── content/
│   ├── tasks/
│   └── settings/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PageHeader.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── Toast.tsx
│   └── features/
│       ├── StatCard.tsx
│       ├── ModuleCard.tsx
│       ├── ListItem.tsx
│       └── ActivityFeed.tsx
└── lib/
    └── utils.ts             # Animation utilities
```

---

## Key Dependencies

- Framer Motion — Already in project, use for page transitions and complex animations
- Lucide React — Already in project, icon library
- Tailwind CSS — Already in project, utility classes

---

## Verification Checklist

- [ ] All pages accessible from sidebar navigation
- [ ] Stats cards display correct data
- [ ] List pages load and display items
- [ ] Detail pages show all tabs
- [ ] Create/edit forms work in modals
- [ ] Loading states shown during data fetch
- [ ] Empty states shown when no data
- [ ] Success/error feedback displayed
- [ ] Animations smooth (60fps)
- [ ] Responsive on tablet/mobile
- [ ] No console errors
