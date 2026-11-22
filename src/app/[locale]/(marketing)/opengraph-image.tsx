import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export const alt = 'HyperScan AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing' });

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#040605',
        color: '#E9EFEA',
        padding: '72px',
        fontFamily: 'General Sans, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#55D396',
          }}
        />
        <div style={{ fontSize: '32px', fontWeight: 700 }}>HyperScan AI</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ fontSize: '64px', fontWeight: 700, lineHeight: 1.1 }}>{t('hero.title')}</div>
        <div style={{ fontSize: '28px', color: '#8A9B93', maxWidth: '900px' }}>
          {t('metaDescription')}
        </div>
      </div>
      <div style={{ fontSize: '24px', color: '#55D396' }}>hyperscanai.xyz</div>
    </div>,
    size,
  );
}
