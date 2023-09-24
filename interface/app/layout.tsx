import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Web3Wrapper from '@/components/Web3Wrapper'

const inter = Inter({ subsets: ['latin'] })

// Import styles of packages that you've installed.
// All packages except `@mantine/hooks` require styles imports
import '@mantine/core/styles.css';

import { MantineProvider, ColorSchemeScript } from '@mantine/core';

export const metadata: Metadata = {
  title: 'axiom-starter',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en">
      <head>
      <ColorSchemeScript />

        <link rel="shortcut icon" href="#" />
      </head>
      <body className={inter.className}>
      <MantineProvider >
      <Web3Wrapper>
          {children}
        </Web3Wrapper>
    </MantineProvider>
        
      </body>
    </html>
  )
}
