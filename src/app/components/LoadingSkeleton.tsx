// =============================================================================
// LOADING SKELETONS — Better Loading UX
// =============================================================================

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 rounded';
  const animationClasses = animation === 'pulse' ? 'animate-pulse' : 'animate-shimmer';

  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '40px' : '200px'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
    />
  );
}

// =============================================================================
// BLOG POST CARD SKELETON
// =============================================================================

export function BlogPostCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="space-y-2">
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
        <Skeleton width={60} height={24} className="rounded-full" />
      </div>

      <div className="space-y-2 mb-4">
        <Skeleton width="100%" height={12} />
        <Skeleton width="95%" height={12} />
        <Skeleton width="90%" height={12} />
        <Skeleton width="85%" height={12} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Skeleton height={40} />
        <Skeleton height={40} />
      </div>
    </div>
  );
}

// =============================================================================
// TABLE SKELETON
// =============================================================================

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} className="flex-1">
            <Skeleton height={16} />
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-3 mt-3">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 py-2">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div key={colIdx} className="flex-1">
                <Skeleton height={14} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// ANALYTICS CARD SKELETON
// =============================================================================

export function AnalyticsCardSkeleton() {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton width={60} height={32} />
      </div>
      <Skeleton width={100} height={12} className="mb-2" />
      <Skeleton width={150} height={16} />
    </div>
  );
}

// =============================================================================
// DASHBOARD SKELETON
// =============================================================================

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width={200} height={24} />
          <Skeleton width={300} height={14} />
        </div>
        <Skeleton width={120} height={40} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <AnalyticsCardSkeleton key={idx} />
        ))}
      </div>

      {/* Content */}
      <div className="bg-white border rounded-lg p-6">
        <Skeleton width={180} height={20} className="mb-4" />
        <TableSkeleton rows={8} columns={5} />
      </div>
    </div>
  );
}

// =============================================================================
// LIST SKELETON
// =============================================================================

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </div>
          <Skeleton width={80} height={32} />
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// FORM SKELETON
// =============================================================================

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, idx) => (
        <div key={idx} className="space-y-2">
          <Skeleton width={100} height={14} />
          <Skeleton height={40} className="rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 mt-6">
        <Skeleton width={100} height={40} />
        <Skeleton width={100} height={40} />
      </div>
    </div>
  );
}

// =============================================================================
// CHART SKELETON
// =============================================================================

export function ChartSkeleton() {
  return (
    <div className="bg-white border rounded-lg p-6">
      <Skeleton width={180} height={20} className="mb-6" />
      <div className="h-64 flex items-end justify-between gap-2">
        {Array.from({ length: 12 }).map((_, idx) => {
          const height = Math.random() * 100 + 50;
          return (
            <Skeleton
              key={idx}
              width="100%"
              height={`${height}px`}
              className="rounded-t-lg"
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} width={40} height={12} />
        ))}
      </div>
    </div>
  );
}
