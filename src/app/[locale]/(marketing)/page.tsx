import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { LandingPageView } from './_components/landing-page-view';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });
  const canonical = `https://hyperscanai.xyz/${locale}`;
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical,
      languages: {
        vi: 'https://hyperscanai.xyz/vi',
        en: 'https://hyperscanai.xyz/en',
        'x-default': 'https://hyperscanai.xyz/en',
      },
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: canonical,
      siteName: 'HyperScan AI',
      locale: locale === 'vi' ? 'vi_VN' : 'en_US',
      type: 'website',
      images: [
        {
          url: `${canonical}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: t('metaTitle'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('metaDescription'),
      images: [`${canonical}/opengraph-image`],
    },
  };
}

export default async function MarketingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'landing' });

  const faqItems = [1, 2, 3, 4, 5, 6].map((i) => ({
    question: t(`faq.q${i}`),
    answer: t(`faq.a${i}`),
  }));

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'HyperScan AI',
      url: 'https://hyperscanai.xyz',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'HyperScan AI',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      url: `https://hyperscanai.xyz/${locale}`,
      description: t('metaDescription'),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ];

  return (
    <>
      {jsonLd.map((obj, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
      <LandingPageView />
    </>
  );
}
