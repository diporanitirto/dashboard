'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import {
  BPH_POSITIONS,
  PANGKAT_LABELS,
  ROLE_LABELS,
  allPangkatOptions,
  type Pangkat,
} from '@/lib/auth';

const MAX_BIO_LENGTH = 500;

export default function ProfilPage() {
  const { profile, session, loading, refreshProfile } = useProfile();
  const [fullName, setFullName] = useState('');
  const [pangkat, setPangkat] = useState<Pangkat>('anggota');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const availablePangkat: readonly Pangkat[] = useMemo(() => {
    // Admin bisa pilih semua pangkat
    if (profile?.role === 'admin') return allPangkatOptions;
    // BPH hanya bisa pilih pangkat BPH
    if (profile?.role === 'bph') return BPH_POSITIONS;
    // Role lain bisa pilih semua
    return allPangkatOptions;
  }, [profile?.role]);

  useEffect(() => {
    if (!profile) {
      setFullName('');
      setPangkat('anggota');
      setBio('');
      return;
    }
    setFullName(profile.full_name ?? '');
    setPangkat(profile.pangkat);
    setBio(profile.bio ?? '');
  }, [profile]);

  useEffect(() => {
    if (!availablePangkat.includes(pangkat)) {
      setPangkat(availablePangkat[0]);
    }
  }, [availablePangkat, pangkat]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
      setStatus('Sesi tidak ditemukan. Silakan masuk ulang.');
      return;
    }
    if (!fullName.trim()) {
      setStatus('Nama lengkap wajib diisi.');
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          pangkat,
          bio: bio.trim().length > 0 ? bio.trim() : null,
        }),
      });

      if (!response.ok) {
        const message = (await response.json().catch(() => null)) as { error?: string } | null;
        setStatus(message?.error ?? 'Gagal menyimpan profil.');
        return;
      }

      await refreshProfile();
      setStatus('Profil berhasil diperbarui.');
    } catch (error) {
      console.error('Update profile error:', error);
      setStatus('Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-slate-600">
        Memuat data profil...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-slate-600">
        Kamu belum masuk. Silakan kembali ke{' '}
        <Link href="/" className="font-semibold text-emerald-600 underline">
          halaman utama
        </Link>{' '}
        untuk login terlebih dahulu.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
              Profil Anggota
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Data Pribadi Diporani</h1>
            <p className="mt-1 text-sm text-slate-600">
              Perbarui nama lengkap, pangkat, dan informasi tambahanmu agar pengurus lain mudah melakukan koordinasi.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p>Email terdaftar: <span className="font-mono text-xs text-slate-500">{session.user.email}</span></p>
            <p>Peran saat ini: <span className="font-semibold text-slate-800">{profile ? ROLE_LABELS[profile.role] : 'Belum ditetapkan'}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="full-name-input">
              Nama Lengkap
            </label>
            <input
              id="full-name-input"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Contoh: Dian Pramuka Tirta"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700" htmlFor="pangkat-select">
                Pangkat
              </label>
              <select
                id="pangkat-select"
                value={pangkat}
                onChange={(event) => setPangkat(event.target.value as Pangkat)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {availablePangkat.map((item) => (
                  <option key={item} value={item}>
                    {PANGKAT_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Peran</label>
              <input
                value={profile ? ROLE_LABELS[profile.role] : 'Menunggu verifikasi'}
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700" htmlFor="bio-textarea">
              Informasi Tambahan
            </label>
            <textarea
              id="bio-textarea"
              value={bio}
              onChange={(event) => {
                const next = event.target.value.slice(0, MAX_BIO_LENGTH);
                setBio(next);
              }}
              placeholder="Tambahkan nomor kontak, regu, atau catatan penting lainnya."
              rows={4}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <p className="text-xs text-slate-500">{bio.length}/{MAX_BIO_LENGTH} karakter</p>
          </div>

          {status && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {status}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Perubahan disimpan ke Supabase dan akan dipakai untuk verifikasi akses fitur sesuai peran.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
