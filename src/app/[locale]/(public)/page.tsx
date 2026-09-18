import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div className="flex flex-1 items-center justify-center">
      <h1 className="text-2xl font-bold">{t('appName')}</h1>
    </div>
  );
}
