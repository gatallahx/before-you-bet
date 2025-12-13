import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 animate-pulse overflow-hidden">
      {/* Header with circle and title skeleton */}
      <div className="flex gap-3 mb-4">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2" />
        </div>
      </div>
      {/* Price bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-14 flex-shrink-0" />
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700/50 rounded-full" />
      </div>
      {/* Footer skeleton */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-16" />
        <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700/50 rounded-full" />
      </div>
    </div>
  );
}
