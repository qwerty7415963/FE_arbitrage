import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Providers } from '@/components/shared/providers';
import { HtmlLangSetter } from '@/components/shared/html-lang-setter';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  return {
    title: t('appName'),
    description: t('description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <>
      <Providers>
        <NextIntlClientProvider messages={messages}>
          <HtmlLangSetter />
          <TooltipProvider>{children}</TooltipProvider>
        </NextIntlClientProvider>
      </Providers>
    </>
  );
}
