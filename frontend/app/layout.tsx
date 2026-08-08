import './globals.css';
import type { Metadata } from 'next';
import { AppShell } from '../components/app-shell';

export const metadata: Metadata = {
  title: 'Work Clat — AP Automation',
  description: 'Work Clat: AI-powered accounts payable automation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
