"use client";

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
