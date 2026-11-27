'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Link } from '@/i18n/navigation';
import { MenuIcon, XIcon } from 'lucide-react';

export function MarketingMobileNav() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('landing');

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" aria-label={t('nav.menu')} />}>
          <MenuIcon className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetTitle className="sr-only">{t('nav.menu')}</SheetTitle>
          <nav className="flex flex-col gap-2 p-4">
            <Link
              href="/traders"
              onClick={() => setOpen(false)}
              className="hover:bg-interactive-hover rounded-md px-3 py-2 text-sm font-medium"
            >
              {t('nav.scanner')}
            </Link>
            <Link
              href="/funding-arbitrage"
              onClick={() => setOpen(false)}
              className="hover:bg-interactive-hover rounded-md px-3 py-2 text-sm font-medium"
            >
              {t('nav.funding')}
            </Link>
            <a
              href="#how-it-works"
              onClick={() => setOpen(false)}
              className="hover:bg-interactive-hover rounded-md px-3 py-2 text-sm font-medium"
            >
              {t('nav.howItWorks')}
            </a>
            <a
              href="#faq"
              onClick={() => setOpen(false)}
              className="hover:bg-interactive-hover rounded-md px-3 py-2 text-sm font-medium"
            >
              {t('nav.faq')}
            </a>
            <Link href="/traders" onClick={() => setOpen(false)} className="mt-2">
              <Button className="w-full">{t('hero.primaryCta')}</Button>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
