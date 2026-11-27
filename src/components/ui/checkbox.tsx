import * as React from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from 'cn';

function Checkbox({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <span className={cn('relative inline-flex size-4 shrink-0 align-middle', className)}>
      <input
        type="checkbox"
        className={cn(
          'peer border-border-strong bg-surface size-full cursor-pointer appearance-none rounded-[5px] border transition-colors',
          'checked:border-primary-border checked:bg-primary',
          'focus-visible:ring-focus-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        {...props}
      />
      <CheckIcon
        className="text-primary-foreground pointer-events-none absolute inset-0 m-auto size-3 opacity-0 peer-checked:opacity-100"
        strokeWidth={3}
        aria-hidden
      />
    </span>
  );
}

export { Checkbox };
