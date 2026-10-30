'use client';

import { useAuthStore } from '@/lib/stores/auth';
import { AppLayout } from '@/components/shared/layout/app-layout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { isInitialized, isLoading } = useAuthStore();

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
