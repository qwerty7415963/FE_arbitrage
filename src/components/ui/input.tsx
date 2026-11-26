import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from 'cn';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'border-border-strong bg-surface text-text-primary focus-visible:border-focus-ring focus-visible:ring-focus-ring/30 hover:border-text-muted placeholder:text-text-muted disabled:bg-disabled-background disabled:text-disabled-foreground aria-invalid:border-danger aria-invalid:ring-danger/20 accent-primary-text h-8 w-full min-w-0 rounded-lg border px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 disabled:pointer-events-none disabled:cursor-not-allowed aria-invalid:ring-2 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
