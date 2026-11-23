import { getTranslations } from 'next-intl/server';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { Logo } from '@/components/shared/brand/logo';
import { Link } from '@/i18n/navigation';

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('landing');
  return (
    <div className="bg-background text-foreground min-h-screen">
      <header className="border-border bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="HyperScan AI">
            <Logo size="sm" />
          </Link>
          <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
            <Link
              href="/traders"
              className="hover:text-foreground transition-colors motion-reduce:transition-none"
            >
              {t('nav.scanner')}
            </Link>
            <Link
              href="/funding-arbitrage"
              className="hover:text-foreground transition-colors motion-reduce:transition-none"
            >
              {t('nav.funding')}
            </Link>
            <a
              href="#how-it-works"
              className="hover:text-foreground transition-colors motion-reduce:transition-none"
            >
              {t('nav.howItWorks')}
            </a>
            <a
              href="#faq"
              className="hover:text-foreground transition-colors motion-reduce:transition-none"
            >
              {t('nav.faq')}
            </a>
          </nav>
          <div className="preserve-control-size language-switcher">
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="w-full">{children}</main>
      <footer className="border-border bg-card/40 border-t">
        <div className="mx-auto flex w-full flex-col gap-3 px-4 py-8 lg:px-6">
          <Logo size="sm" variant="muted" />
          <p className="text-muted-foreground text-xs">HyperScan AI</p>
          <p className="text-destructive text-xs">{t('footer.disclaimer')}</p>
        </div>
      </footer>
    </div>
  );
}
