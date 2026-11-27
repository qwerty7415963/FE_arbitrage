'use client';

import * as React from 'react';
import { Toast } from '@base-ui/react/toast';
import { cn } from 'cn';

interface ToastContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      showError: (message: string) => {
        console.error(message);
      },
      showSuccess: (message: string) => {
        console.log(message);
      },
    };
  }
  return ctx;
}

function ToastInner({ children }: { children: React.ReactNode }) {
  const manager = Toast.useToastManager();

  const value = React.useMemo<ToastContextValue>(
    () => ({
      showError: (message: string) => {
        manager.add({
          title: 'Error',
          description: message,
          type: 'error',
          timeout: 5000,
          priority: 'high',
        });
      },
      showSuccess: (message: string) => {
        manager.add({
          title: 'Success',
          description: message,
          type: 'success',
          timeout: 3000,
        });
      },
    }),
    [manager],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast.Viewport className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none">
        {manager.toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className={cn(
              'bg-elevated text-foreground border-border-subtle rounded-xl border p-4 shadow-lg',
              toast.type === 'error' && 'border-danger/40',
              toast.type === 'success' && 'border-success/40',
            )}
          >
            <Toast.Title className="text-sm font-semibold">{toast.title}</Toast.Title>
            {toast.description ? (
              <Toast.Description className="text-muted-foreground mt-1 text-sm">
                {toast.description}
              </Toast.Description>
            ) : null}
            <Toast.Close className="text-muted-foreground hover:text-foreground absolute top-2 right-2">
              ×
            </Toast.Close>
          </Toast.Root>
        ))}
      </Toast.Viewport>
    </ToastContext.Provider>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <Toast.Provider>
      <ToastInner>{children}</ToastInner>
    </Toast.Provider>
  );
}
