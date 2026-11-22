import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const locales = ['vi', 'en'] as const;
  return locales.flatMap((locale) => [
    {
      url: `https://hyperscanai.xyz/${locale}`,
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `https://hyperscanai.xyz/${locale}/funding-arbitrage`,
      lastModified,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
  ]);
}
