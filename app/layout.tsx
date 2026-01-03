// app/layout.tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import LoadingBar from '@/components/loading-bar';
import GlobalLoading from '@/components/GlobalLoading';
import { ModalSetup } from '@/components/ui/modal';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: {
    default: 'DiasporaBase',
    template: '%s | DiasporaBase',
  },
  description: 'Connecting diaspora volunteers with meaningful opportunities, agencies, and impactful projects worldwide.',
  metadataBase: new URL('https://diasporabase.com'),
  keywords: [
    'diaspora volunteers',
    'volunteer opportunities',
    'non-profit volunteering',
    'agency project management',
    'community impact',
    'diaspora engagement',
    'volunteer matching',
    'project coordination',
  ],
  authors: [{ name: 'DiasporaBase Team', url: 'https://diasporabase.com' }],
  creator: 'DiasporaBase Team',
  publisher: 'DiasporaBase',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://diasporabase.com',
    languages: {
      'en-US': 'https://diasporabase.com',
    },
  },
  openGraph: {
    title: 'DiasporaBase',
    description: 'Connecting diaspora volunteers with meaningful opportunities, agencies, and impactful projects worldwide.',
    url: 'https://diasporabase.com',
    siteName: 'DiasporaBase',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DiasporaBase - Volunteer Opportunities Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DiasporaBase',
    description: 'Connecting diaspora volunteers with meaningful opportunities, agencies, and impactful projects worldwide.',
    images: ['/og-image.png'],
    creator: '@DiasporaBaseHQ', // Add your Twitter handle if available
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data (Organization) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'DiasporaBase',
              url: 'https://diasporabase.com',
              logo: 'https://jbgnohxjwrvepqnlpccy.supabase.co/storage/v1/object/public/app_images/logo.svg',
              description: 'Connecting diaspora volunteers with meaningful opportunities, agencies, and impactful projects worldwide.',
              sameAs: [
                'https://twitter.com/DiasporaBaseHQ',
                'https://linkedin.com/company/diasporabase',
                'https://facebook.com/diasporabase',
              ],
            }),
          }}
        />
      </head>
      <body className={`${poppins.className} antialiased`}>
        <GlobalLoading />
        <LoadingBar />
        <ModalSetup />
        {children}

        <Toaster
          position="top-right"
          richColors
          duration={6000} 
          closeButton
        />
      </body>
    </html>
  );
}