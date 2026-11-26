'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function LandingPageView() {
  const t = useTranslations('landing');

  const features = [
    { key: 'scanner', title: t('features.scanner.title'), copy: t('features.scanner.copy') },
    { key: 'funding', title: t('features.funding.title'), copy: t('features.funding.copy') },
    { key: 'alerts', title: t('features.alerts.title'), copy: t('features.alerts.copy') },
  ];

  const steps = [1, 2, 3].map((i) => ({
    n: i,
    title: t(`howItWorks.step${i}Title`),
    copy: t(`howItWorks.step${i}Copy`),
  }));

  const metrics = [
    t('metrics.history30d'),
    t('metrics.multiVenue'),
    t('metrics.realtime'),
    t('metrics.telegram'),
  ];

  const faqs = [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`faq.q${i}`),
    a: t(`faq.a${i}`),
  }));

  const fundingRows = [
    { pair: 'BTC-PERP', venue: 'Hyperliquid / Binance', spread: '+0.012%', apr: '14.2%' },
    { pair: 'ETH-PERP', venue: 'Extended / Variational', spread: '-0.008%', apr: '9.6%' },
    { pair: 'SOL-PERP', venue: 'Hyperliquid / Extended', spread: '+0.021%', apr: '22.4%' },
  ];

  const scannerRows = [
    { rank: '01', trader: '0x12…ab', roi: '+42.1%', win: '68%', status: 'Ready' },
    { rank: '02', trader: '0x9f…22', roi: '+18.4%', win: '61%', status: 'Syncing' },
    { rank: '03', trader: '0x4c…09', roi: '-3.2%', win: '49%', status: 'Ready' },
  ];

  const signals = [
    t('ticker.s1'),
    t('ticker.s2'),
    t('ticker.s3'),
    t('ticker.s4'),
    t('ticker.s5'),
    t('ticker.s6'),
  ];

  const provenance = [
    { title: t('provenance.readOnly'), copy: t('provenance.readOnlyCopy') },
    { title: t('provenance.noCustody'), copy: t('provenance.noCustodyCopy') },
    { title: t('provenance.freshness'), copy: t('provenance.freshnessCopy') },
    { title: t('provenance.history'), copy: t('provenance.historyCopy') },
  ];

  const isItems = [1, 2, 3].map((i) => t(`whatItIs.is${i}`));
  const isntItems = [1, 2, 3].map((i) => t(`whatItIs.isnt${i}`));

  return (
    <div className="w-full">
      <section className="border-border bg-background relative overflow-hidden border-b">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:px-6 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-xs tracking-wide text-[var(--text-muted)]">
              {t('hero.eyebrow')}
            </p>
            <h1 className="text-foreground mt-4 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              {t('hero.title')}
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-base leading-relaxed">
              {t('hero.subcopy')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/traders"
                className="bg-primary text-primary-foreground hover:bg-secondary inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors motion-reduce:transition-none"
              >
                {t('hero.primaryCta')}
              </Link>
              <Link
                href="/funding-arbitrage"
                className="border-border bg-card text-foreground hover:border-primary inline-flex items-center rounded-md border px-5 py-2.5 text-sm font-semibold transition-colors motion-reduce:transition-none"
              >
                {t('hero.secondaryCta')}
              </Link>
            </div>
          </div>

          <div
            className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5"
            style={{ boxShadow: '0 0 0 1px var(--border)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {t('liveDesk.title')}
              </h2>
              <span className="rounded-full border border-[var(--primary-text)]/40 bg-[var(--primary-text)]/10 px-2 py-0.5 text-xs text-[var(--primary-text)]">
                {t('liveDesk.label')}
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {fundingRows.map((row) => (
                <div
                  key={row.pair}
                  className="bg-background flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-xs"
                >
                  <div>
                    <p className="text-foreground font-mono font-semibold tabular-nums">
                      {row.pair}
                    </p>
                    <p className="text-muted-foreground">{row.venue}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[var(--primary-text)] tabular-nums">
                      {row.spread}
                    </p>
                    <p className="text-muted-foreground">{row.apr}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-background mt-4 rounded-md border border-[var(--border)] p-3 text-xs">
              <p className="text-foreground font-mono">{t('liveDesk.dossierTitle')}</p>
              <p className="text-muted-foreground mt-1">{t('liveDesk.dossierBody')}</p>
            </div>
          </div>
        </div>

        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-20">
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="h-full w-full">
            <path
              d="M0,40 C300,4 900,76 1200,40"
              stroke="var(--primary)"
              strokeWidth="10"
              fill="none"
              opacity="0.08"
            />
            <path
              d="M0,40 C300,4 900,76 1200,40"
              stroke="var(--primary)"
              strokeWidth="1.5"
              fill="none"
              opacity="0.55"
            />
          </svg>
        </div>
      </section>

      <section className="border-border bg-card/40 border-y">
        <div className="mx-auto max-w-6xl overflow-hidden px-4 py-3">
          <div className="landing-ticker-track text-muted-foreground flex w-max gap-8 text-xs whitespace-nowrap">
            {[...signals, ...signals].map((signal, index) => (
              <span key={index} className="font-mono tabular-nums">
                {signal}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-foreground text-2xl font-semibold">{t('productDemo.title')}</h2>
        </div>
        <div className="mt-6 grid overflow-hidden rounded-lg border border-[var(--border)] md:grid-cols-2">
          <div className="bg-[var(--background)] p-5">
            <h3 className="mb-4 font-mono text-sm font-semibold text-[var(--foreground)]">
              {t('productDemo.scannerTitle')}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">Trader</th>
                    <th className="py-2 pr-3 text-right font-medium">ROI</th>
                    <th className="py-2 pr-3 text-right font-medium">Win</th>
                    <th className="py-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scannerRows.map((row) => (
                    <tr key={row.rank} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-2 pr-3 font-mono text-[var(--text-muted)] tabular-nums">
                        {row.rank}
                      </td>
                      <td className="text-foreground py-2 pr-3 font-mono">{row.trader}</td>
                      <td className="py-2 pr-3 text-right font-mono text-[var(--primary-text)] tabular-nums">
                        {row.roi}
                      </td>
                      <td className="text-foreground py-2 pr-3 text-right font-mono tabular-nums">
                        {row.win}
                      </td>
                      <td className="py-2 text-right text-[var(--text-muted)]">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="border-t border-[var(--border)] bg-[var(--surface)] p-5 md:border-t-0 md:border-l">
            <h3 className="mb-4 font-mono text-sm font-semibold text-[var(--foreground)]">
              {t('productDemo.fundingTitle')}
            </h3>
            <div className="space-y-2">
              {fundingRows.map((row) => (
                <div
                  key={row.pair}
                  className="bg-background flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-xs"
                >
                  <div>
                    <p className="text-foreground font-mono font-semibold tabular-nums">
                      {row.pair}
                    </p>
                    <p className="text-muted-foreground">{row.venue}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[var(--primary-text)] tabular-nums">
                      {row.spread}
                    </p>
                    <p className="text-muted-foreground">{row.apr}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-border bg-card/40 border-y">
        <div className="mx-auto grid w-full max-w-6xl gap-0 md:grid-cols-4 md:divide-x md:divide-[var(--border)]">
          {provenance.map((item) => (
            <div key={item.title} className="px-4 py-6">
              <h3 className="font-mono text-sm font-semibold text-[var(--primary-text)]">
                {item.title}
              </h3>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-6">
        <h2 className="text-foreground text-2xl font-semibold">{t('whatItIs.title')}</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-mono text-sm font-semibold text-[var(--primary-text)]">
              {t('whatItIs.isTitle')}
            </h3>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm leading-relaxed">
              {isItems.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-[var(--primary-text)]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold text-[var(--text-muted)]">
              {t('whatItIs.isntTitle')}
            </h3>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm leading-relaxed">
              {isntItems.map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-[var(--text-muted)]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-6">
        <h2 className="text-foreground text-2xl font-semibold">{t('features.title')}</h2>
        <div className="divide-border border-border mt-6 divide-y border-y">
          {features.map((feature) => (
            <div key={feature.key} className="grid gap-2 py-6 md:grid-cols-[200px_1fr]">
              <h3 className="font-mono text-lg font-semibold text-[var(--primary-text)]">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 lg:px-6"
      >
        <h2 className="text-foreground text-2xl font-semibold">{t('howItWorks.title')}</h2>
        <div className="divide-border border-border mt-6 divide-y border-y">
          {steps.map((step) => (
            <div key={step.n} className="grid gap-3 py-6 md:grid-cols-[64px_220px_1fr]">
              <span className="bg-primary text-primary-foreground inline-flex h-9 w-9 items-center justify-center rounded-md font-mono text-sm font-bold">
                {step.n}
              </span>
              <h3 className="text-foreground text-base font-semibold">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-border bg-card/30 border-y">
        <div className="divide-border mx-auto grid w-full max-w-6xl divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
          {metrics.map((metric) => (
            <div key={metric} className="px-4 py-6 text-center">
              <p className="text-foreground font-mono text-sm font-semibold tabular-nums">
                {metric}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 lg:px-6">
        <h2 className="text-foreground text-2xl font-semibold">{t('faq.title')}</h2>
        <div className="divide-border border-border mt-6 divide-y border-y">
          {faqs.map((faq, index) => (
            <div key={index} className="py-5">
              <h3 className="text-foreground text-base font-semibold">{faq.q}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-6">
        <div className="bg-card border border-[var(--border)] p-8 text-center">
          <h2 className="text-foreground text-2xl font-semibold">{t('finalCta.title')}</h2>
          <p className="text-muted-foreground mt-3 text-sm">{t('finalCta.copy')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/traders"
              className="bg-primary text-primary-foreground hover:bg-secondary inline-flex items-center rounded-md px-5 py-2.5 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              {t('finalCta.title')}
            </Link>
            <Link
              href="/traders/overview"
              className="border-border bg-background text-foreground hover:border-primary inline-flex items-center rounded-md border px-5 py-2.5 text-sm font-semibold transition-colors motion-reduce:transition-none"
            >
              {t('finalCta.secondary')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
