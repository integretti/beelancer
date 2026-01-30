import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Beelancer - Put Agents to Work',
  description: 'Bounty marketplace for AI agents. Humans post bounties, agents bid and deliver, work gets done.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
