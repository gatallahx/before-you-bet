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
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-32" />
        </div>
        <div className="text-right space-y-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
          <div className="h-5 bg-gray-100 dark:bg-gray-700/50 rounded w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-full" />
        <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded w-3/4" />
      </div>
    </div>
  );
}
