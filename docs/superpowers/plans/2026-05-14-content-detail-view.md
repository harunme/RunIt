# Content Detail View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add modal-based content detail view when clicking items on /content page, with a secondary modal for viewing original source URL and raw content.

**Architecture:** Create two new modal components (ContentDetailModal, OriginalContentModal) that follow existing Modal patterns. Modify the content page to manage state for selected content and modal visibility.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, framer-motion (existing), Modal component (existing)

---

## File Structure

```
web/src/components/content/
  ContentDetailModal.tsx     # Main detail modal with metadata + content
  OriginalContentModal.tsx   # Shows URL + raw content

web/src/app/content/
  page.tsx                   # Add state + render ContentDetailModal
```

---

## Task 1: Create ContentDetailModal Component

**Files:**
- Create: `web/src/components/content/ContentDetailModal.tsx`
- Modify: `web/src/app/content/page.tsx` (to add state and import)

- [ ] **Step 1: Read existing Modal component for reference**

Read: `web/src/components/ui/Modal.tsx`

- [ ] **Step 2: Create ContentDetailModal component**

```tsx
"use client";

import { X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Content } from "@/app/content/page";

interface ContentDetailModalProps {
  open: boolean;
  onClose: () => void;
  content: Content | null;
  onViewOriginal: () => void;
}

export function ContentDetailModal({
  open,
  onClose,
  content,
  onViewOriginal,
}: ContentDetailModalProps) {
  if (!content) return null;

  return (
    <Modal open={open} onClose={onClose} title={content.title} size="lg">
      <div className="space-y-4">
        {/* Metadata header */}
        <div className="text-sm text-gray-500 border-b pb-3">
          <span>Source: {content.source_id}</span>
          {content.author && (
            <>
              <span className="mx-2">•</span>
              <span>Author: {content.author}</span>
            </>
          )}
          <span className="mx-2">•</span>
          <span>{new Date(content.created_at).toLocaleDateString()}</span>
        </div>

        {/* Content */}
        <div className="prose prose-sm max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content.content }} />
        </div>

        {/* View Original button */}
        <div className="pt-4 border-t">
          <button
            onClick={onViewOriginal}
            className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
          >
            View Original
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/content/ContentDetailModal.tsx
git commit -m "feat: add ContentDetailModal component"
```

---

## Task 2: Create OriginalContentModal Component

**Files:**
- Create: `web/src/components/content/OriginalContentModal.tsx`

- [ ] **Step 1: Create OriginalContentModal component**

```tsx
"use client";

import { ExternalLink } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Content } from "@/app/content/page";

interface OriginalContentModalProps {
  open: boolean;
  onClose: () => void;
  content: Content | null;
}

export function OriginalContentModal({
  open,
  onClose,
  content,
}: OriginalContentModalProps) {
  if (!content) return null;

  return (
    <Modal open={open} onClose={onClose} title="Original Source" size="lg">
      <div className="space-y-4">
        {/* URL section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">URL</h3>
          {content.url ? (
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-gray-100 transition-colors break-all"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span>{content.url}</span>
            </a>
          ) : (
            <p className="text-gray-400 italic p-3 bg-gray-50 rounded-lg">
              No URL available
            </p>
          )}
        </div>

        {/* Raw content section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Raw Content</h3>
          <pre className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
            {content.content}
          </pre>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/content/OriginalContentModal.tsx
git commit -m "feat: add OriginalContentModal component"
```

---

## Task 3: Integrate modals into content page

**Files:**
- Modify: `web/src/app/content/page.tsx`

- [ ] **Step 1: Read current content page**

Read: `web/src/app/content/page.tsx`

- [ ] **Step 2: Add state and import new components**

Add these imports:
```tsx
import { ContentDetailModal } from "@/components/content/ContentDetailModal";
import { OriginalContentModal } from "@/components/content/OriginalContentModal";
```

Add state after the existing state declarations:
```tsx
const [selectedContent, setSelectedContent] = useState<Content | null>(null);
const [showOriginalModal, setShowOriginalModal] = useState(false);
```

- [ ] **Step 3: Update ListItem onClick handlers**

Change the ListItem onClick from:
```tsx
onClick={item.url ? undefined : () => {}}
```
To:
```tsx
onClick={() => setSelectedContent(item)}
```

- [ ] **Step 4: Add modal components before the closing div**

Add at the end of the component, before the final `</div>`:
```tsx
<ContentDetailModal
  open={selectedContent !== null}
  onClose={() => setSelectedContent(null)}
  content={selectedContent}
  onViewOriginal={() => setShowOriginalModal(true)}
/>

<OriginalContentModal
  open={showOriginalModal}
  onClose={() => setShowOriginalModal(false)}
  content={selectedContent}
/>
```

- [ ] **Step 5: Commit**

```bash
git add web/src/app/content/page.tsx
git commit -m "feat: integrate content detail modals into content page"
```

---

## Task 4: Verification

- [ ] **Step 1: Start dev server**

```bash
cd web && npm run dev
```

- [ ] **Step 2: Test main modal**

Navigate to `/content`, click any content item:
- [ ] Modal opens
- [ ] Metadata displays (source, author, date)
- [ ] Content renders correctly
- [ ] "View Original" button visible

- [ ] **Step 3: Test original modal**

Click "View Original":
- [ ] Original modal opens
- [ ] URL is clickable (if present)
- [ ] Raw content displays correctly

- [ ] **Step 4: Test close interactions**

For both modals:
- [ ] × button closes modal
- [ ] Escape key closes modal
- [ ] Backdrop click closes modal

- [ ] **Step 5: Commit any final changes**

---

## Spec Coverage Check

| Spec Requirement | Task |
|------------------|------|
| Click content item → modal | Task 3 |
| Metadata header (source, author, date) | Task 1 |
| Full content display | Task 1 |
| View Original button | Task 1 |
| Original modal with URL + raw | Task 2 |
| All close interactions | Tasks 1, 2 |
