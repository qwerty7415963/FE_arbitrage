import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Providers } from '@/components/shared/providers';
import { HtmlLangSetter } from '@/components/shared/html-lang-setter';

export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
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
