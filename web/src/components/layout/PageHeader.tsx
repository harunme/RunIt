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
        <h1
          className="text-[36px] font-extrabold tracking-tight mb-3"
          style={{ color: "var(--text-main)" }}
        >
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
