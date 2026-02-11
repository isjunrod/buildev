import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Buildev',
  description: 'Professional AI-Powered Responsive Web Builder',
  generator: 'v0.app',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --background: #0f0f0f;
            --foreground: #ffffff;
            --primary: #0D99FF;
            --primary-dark: #0a7acc;
            --surface: #1e1e1e;
            --surface-light: #2a2a2a;
            --muted: #666666;
            --accent: #0D99FF;
          }
        `}</style>
      </head>
      <body className="antialiased bg-[#0f0f0f] text-white" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
