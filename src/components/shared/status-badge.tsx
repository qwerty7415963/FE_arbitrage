import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      severity: {
        neutral: 'bg-surface-tertiary text-text-secondary',
        brand: 'bg-primary-subtle text-primary-text',
        success: 'bg-success-subtle text-success',
        warning: 'bg-warning-subtle text-warning',
        danger: 'bg-danger-subtle text-danger',
        info: 'bg-info-subtle text-info',
      },
    },
    defaultVariants: {
      severity: 'neutral',
    },
  },
);

export interface StatusBadgeProps
  extends React.ComponentProps<'span'>, VariantProps<typeof statusBadgeVariants> {}

export function StatusBadge({ className, severity, ...props }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ severity }), className)}
      {...props}
    />
  );
}

export { statusBadgeVariants };
