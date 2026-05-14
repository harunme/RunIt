'use client';

import { motion } from 'framer-motion';
import {
  LucideIcon,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react';

export type ActivityType = 'success' | 'warning' | 'error' | 'info';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

const typeConfig: Record<
  ActivityType,
  { icon: LucideIcon; color: string; bg: string }
> = {
  success: {
    icon: CheckCircle,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="space-y-3">
      {activities.map((activity, index) => {
        const config = typeConfig[activity.type];
        const Icon = config.icon;

        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`flex gap-3 p-4 rounded-xl ${config.bg}`}
          >
            <div className="flex-shrink-0">
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {activity.title}
              </p>
              {activity.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {activity.description}
                </p>
              )}
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                {activity.timestamp}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
