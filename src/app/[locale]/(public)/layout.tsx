import { AppLayout } from '@/components/shared/layout/app-layout';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
