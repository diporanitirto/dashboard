import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ProfileProvider } from '@/components/ProfileProvider';
import { TopNav } from '@/components/TopNav';
import './globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
	title: 'Dashboard DIPORANI',
	description: 'Portal internal Diporani Tirto untuk izin, agenda, materi, dan dokumentasi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-slate-50 antialiased`}>
        <ProfileProvider>
          <TopNav />
          <main className="min-h-screen pb-12">
            {children}
          </main>
        </ProfileProvider>
      </body>
    </html>
  );
}
