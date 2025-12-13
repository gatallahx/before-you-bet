import { cn } from '@/lib/utils';

type BadgeVariant = 'yes' | 'no' | 'uncertain' | 'high' | 'medium' | 'low';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  yes: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
  no: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  uncertain: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
  high: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
  low: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
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

// Convenience components for common use cases
export function OutcomeBadge({ outcome, confidence }: { outcome: 'YES' | 'NO' | 'UNCERTAIN'; confidence: number }) {
  const variant = outcome === 'YES' ? 'yes' : outcome === 'NO' ? 'no' : 'uncertain';
  return (
    <Badge variant={variant}>
      {outcome} ({confidence}%)
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const variant = severity.toLowerCase() as BadgeVariant;
  return <Badge variant={variant}>{severity}</Badge>;
}

export function LikelihoodBadge({ likelihood }: { likelihood: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const variant = likelihood.toLowerCase() as BadgeVariant;
  return <Badge variant={variant}>{likelihood}</Badge>;
}
