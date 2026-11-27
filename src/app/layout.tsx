import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'HyperScan AI',
  description: 'Arbitrage intelligence. Read the wallet before the trade.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F3F5EF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1310' },
  ],
};

const themeInitScript = `(function(){try{var stored=localStorage.getItem('hyperscan.theme');var mode='dark';if(stored){try{var parsed=JSON.parse(stored);if(parsed&&parsed.state&&parsed.state.mode){mode=parsed.state.mode;}else if(typeof parsed==='string'){mode=parsed;}}catch(e){mode=stored;}}var resolved=mode;if(mode==='system'){resolved=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.classList.toggle('dark',resolved==='dark');document.documentElement.style.colorScheme=resolved;}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        {children}
      </body>
    </html>
  );
}
