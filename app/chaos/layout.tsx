import { Metadata, Viewport } from 'next';
import './chaos-styles.css';

export const metadata: Metadata = {
  title: 'Chaos Agent | Full Uproar',
  description: 'Add secret objectives, random events, and betting to your game night!',
  manifest: '/chaos-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Chaos Agent',
  },
  openGraph: {
    title: 'Chaos Agent by Full Uproar',
    description: 'Add chaos to your game night with secret objectives, random events, and more!',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function ChaosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* PWA-specific head elements */}
      <link rel="apple-touch-icon" href="/FuglyLogo.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="mobile-web-app-capable" content="yes" />
      {children}
    </>
  );
}
