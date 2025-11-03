'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { canAccessSection } from '@/lib/auth';

interface Documentation {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  created_at?: string;
}

export default function DokumentasiPage() {
  const { profile, session, loading } = useProfile();
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    if (!session) return;
    
    const fetchDocs = async () => {
      try {
        const response = await fetch('/api/documentation', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDocs(data as Documentation[]);
        }
      } catch (error) {
        console.error('Failed to fetch documentation:', error);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [session]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-slate-600">
        Memuat...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-sm text-slate-600">
        Silakan{' '}
        <Link href="/" className="font-semibold text-emerald-600 underline">
          login
        </Link>{' '}
        terlebih dahulu.
      </div>
    );
  }

  if (!profile || !canAccessSection(profile.role, 'dokumentasi')) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
          <p className="font-semibold">Akses Terbatas</p>
          <p className="mt-1">
            Fitur ini hanya untuk Tim Media. Kembali ke{' '}
            <Link href="/" className="font-semibold underline">
              halaman utama
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
          Dokumentasi
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Kelola Dokumentasi Kegiatan
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Unggah foto dan video kegiatan untuk arsip dan publikasi.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          <p>Fitur upload dokumentasi sedang dalam pengembangan.</p>
          <p className="mt-1">Akan segera tersedia!</p>
        </div>

        {loadingDocs ? (
          <div className="mt-6 text-sm text-slate-500">Memuat dokumentasi...</div>
        ) : docs.length === 0 ? (
          <div className="mt-6 text-sm text-slate-500">Belum ada dokumentasi yang diupload.</div>
        ) : (
          <div className="mt-6 space-y-3">
            {docs.map((doc, idx) => (
              <div
                key={doc.id || idx}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <p className="font-semibold text-slate-900">{doc.title}</p>
                {doc.description && (
                  <p className="mt-1 text-sm text-slate-600">{doc.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
