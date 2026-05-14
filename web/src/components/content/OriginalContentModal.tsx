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
