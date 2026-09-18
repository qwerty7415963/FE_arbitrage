import { AppLayout } from '@/components/shared/layout/app-layout';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // TODO: Check auth session
  // If not authenticated, redirect to login
  return <AppLayout>{children}</AppLayout>;
}
