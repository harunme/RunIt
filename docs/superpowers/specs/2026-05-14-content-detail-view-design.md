# Content Item Detail View - Design Specification

## Overview

Add the ability to view full content details by clicking on a content item in the `/content` page, with access to original source information in a separate modal.

## Requirements

- Click on content item → modal overlay with full content
- Metadata displayed in header (source, author, date)
- "View Original" button → separate modal showing URL and raw content
- Modal closes via × button, Escape key, or backdrop click

## Component Design

### ContentDetailModal

**File:** `web/src/components/content/ContentDetailModal.tsx`

**Props:**
```tsx
interface ContentDetailModalProps {
  open: boolean;
  onClose: () => void;
  content: Content | null;
}
```

**Structure:**
```
┌─────────────────────────────────────────────┐
│  ×                                         │
│  Source: {source} • Author: {author}       │
│  {date}                                    │
│                                             │
│  {title}                                   │
│  ─────────────────────────────────────      │
│                                             │
│  {content}                                 │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │        [View Original]              │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### OriginalModal (nested or separate)

**Structure:**
```
┌─────────────────────────────────────────────┐
│  ×                                         │
│  Original Source                           │
│  ─────────────────────────────────────      │
│                                             │
│  🔗 {url}  (clickable if exists)           │
│                                             │
│  Raw Content                               │
│  ─────────────────────────────────────      │
│  {raw content}                             │
└─────────────────────────────────────────────┘
```

## Data Model

```tsx
interface Content {
  id: string;
  source_id: string;
  title: string;
  content: string;
  url: string | null;
  author: string | null;
  published_at: string | null;
  created_at: string;
}
```

## Implementation Plan

### Files to Create

1. `web/src/components/content/ContentDetailModal.tsx` - Main detail modal
2. `web/src/components/content/OriginalContentModal.tsx` - Original source modal

### Files to Modify

1. `web/src/app/content/page.tsx`:
   - Add `selectedContent: Content | null` state
   - Add `showOriginalModal: boolean` state
   - Update `ListItem` onClick to set `selectedContent`
   - Import and render `ContentDetailModal`

### State Management

```tsx
const [selectedContent, setSelectedContent] = useState<Content | null>(null);
const [showOriginalModal, setShowOriginalModal] = useState(false);
```

## Dependencies

- Existing `Modal` component from `web/src/components/ui/Modal.tsx`
- Existing `Content` type from `web/src/app/content/page.tsx`
- `framer-motion` for animations (already in project)

## Verification Checklist

- [ ] Navigate to `/content` page
- [ ] Click any content item → modal opens with content
- [ ] Metadata displays correctly (source, author, date)
- [ ] Click "View Original" → original modal opens
- [ ] URL is clickable if present
- [ ] Raw content displays correctly
- [ ] All close interactions work (×, Escape, backdrop)
