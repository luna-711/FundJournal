import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: '基金日记',
  description: '记录每一笔卖出，追踪真实收益',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: '基金日记' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#333333',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <style>{`
          :root {
            --bg: #FFFFFF;
            --card: #FFFFFF;
            --tx: #1a1a1a;
            --t2: #888;
            --bd: #E5E5E0;
            --ac: #333333;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #111;
              --card: #1e1e1e;
              --tx: #f0f0f0;
              --t2: #888;
              --bd: #333;
              --ac: #333333;
            }
          }
          * { box-sizing: border-box; }
          input { outline: none; }
          button { font-family: inherit; }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
