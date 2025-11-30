import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ProfileProvider } from '@/components/ProfileProvider';
import { Sidebar } from '@/components/Sidebar';
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
    <html lang="id" className="overflow-x-hidden">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-slate-950 text-slate-50 antialiased overflow-x-hidden`}>
        <ProfileProvider>
          <Sidebar />
          {/* Main content - padding managed by CSS variable from Sidebar */}
          <main className="min-h-screen pb-12 pt-16 lg:pt-0 transition-[padding] duration-300 lg:pl-[var(--sidebar-width)]">
            {children}
          </main>
        </ProfileProvider>
      </body>
    </html>
  );
}
