import { cn } from '@/lib/utils';

type BadgeVariant = 'yes' | 'no' | 'uncertain';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  yes: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
  no: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  uncertain: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// Convenience component for outcome badges
export function OutcomeBadge({ outcome }: { outcome: 'YES' | 'NO' | 'UNCERTAIN' }) {
  const variant = outcome === 'YES' ? 'yes' : outcome === 'NO' ? 'no' : 'uncertain';
  return (
    <Badge variant={variant}>
      {outcome}
    </Badge>
  );
}
