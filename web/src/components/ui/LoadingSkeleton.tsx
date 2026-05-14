'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-200 rounded',
        'before:absolute before:inset-0 before:bg-gradient-to-r before:from-gray-200 before:via-gray-100 before:to-gray-200 before:bg-[length:200%_100%]',
        'animate-shimmer',
        className
      )}
    />
  );
}

interface CardSkeletonProps {
  showImage?: boolean;
  lines?: number;
}

export function CardSkeleton({ showImage = true, lines = 3 }: CardSkeletonProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      {showImage && <Skeleton className="h-40 w-full rounded-lg" />}
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        {lines > 2 && <Skeleton className="h-4 w-2/3" />}
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

interface ListItemSkeletonProps {
  avatar?: boolean;
  lines?: number;
}

export function ListItemSkeleton({ avatar = true, lines = 2 }: ListItemSkeletonProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      {avatar && <Skeleton className="h-10 w-10 rounded-full shrink-0" />}
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        {lines > 1 && <Skeleton className="h-3 w-1/2" />}
      </div>
    </div>
  );
}
