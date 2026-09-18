import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function SidebarHeader() {
  const t = useTranslations('common');

  return (
    <div className="flex h-16 items-center border-b px-4">
      <Link href="/" className="flex items-center gap-2">
        <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
          <span className="text-sm font-bold">A</span>
        </div>
        <span className="text-lg font-semibold">{t('appName')}</span>
      </Link>
    </div>
  );
}
