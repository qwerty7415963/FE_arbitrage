import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';

const bannerVariants = cva('flex items-start gap-3 rounded-lg border px-4 py-3 text-sm', {
  variants: {
    severity: {
      info: 'border-info/30 bg-info-subtle text-info',
      success: 'border-success/30 bg-success-subtle text-success',
      warning: 'border-warning/30 bg-warning-subtle text-warning',
      danger: 'border-danger/30 bg-danger-subtle text-danger',
    },
  },
  defaultVariants: {
    severity: 'info',
  },
});

export interface BannerProps
  extends React.ComponentProps<'div'>, VariantProps<typeof bannerVariants> {}

export function Banner({ className, severity, ...props }: BannerProps) {
  return (
    <div
      data-slot="banner"
      role="status"
      className={cn(bannerVariants({ severity }), className)}
      {...props}
    />
  );
}

export { bannerVariants };
