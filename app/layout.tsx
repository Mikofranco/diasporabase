import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import LoadingBar from "@/components/loading-bar"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], 
})

export const metadata: Metadata = {
  title: "DiaporaBase",
  description: "Connect volunteers with opportunities and manage agencies and projects.",
    generator: 'Next.js',
  applicationName: 'DiasporaBase',
  keywords: ['volunteer', 'community', 'non-profit', 'agency management', 'project management', 'volunteer opportunities'],
  authors: [{ name: 'DiasporaBase Team',
    url: 'https://diasporabase.com' }],
  creator: 'DiasporaBase Team',
  publisher: 'DiasporaBase',
  openGraph: {
    title: 'DiasporaBase',
    description: 'Connect volunteers with opportunities and manage agencies and projects.',
    url: 'https://diasporabase.com',
    siteName: 'DiasporaBase',
    images: [
      {
        url: 'https://diasporabase.org/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DiasporaBase Open Graph Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <LoadingBar/>
      <body className={poppins.className}>{children}</body>
      <Toaster richColors />
    </html>
  )
}
