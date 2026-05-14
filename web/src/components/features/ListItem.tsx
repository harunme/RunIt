'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface ListItemProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  onClick?: () => void;
  href?: string;
}

const defaultIconColor = 'text-zinc-500 dark:text-zinc-400';

export function ListItem({
  icon: Icon,
  iconColor = defaultIconColor,
  title,
  subtitle,
  badge,
  onClick,
  href,
}: ListItemProps) {
  const content = (
    <>
      <div className={`p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {subtitle}
          </p>
        )}
      </div>
      {badge && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {badge}
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-zinc-400" />
    </>
  );

  const wrapperClass =
    'flex items-center gap-4 p-4 -mx-4 px-4 rounded-xl transition-colors group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer';

  if (href) {
    return (
      <Link href={href} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left ${wrapperClass}`}
      whileTap={{ scale: 0.98 }}
    >
      {content}
    </motion.button>
  );
}
