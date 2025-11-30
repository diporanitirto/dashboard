'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import {
  TINGKATAN_LABELS,
  TINGKATAN_OPTIONS,
  JABATAN_LABELS,
  JABATAN_OPTIONS,
  ROLE_LABELS,
  type Tingkatan,
  type Jabatan,
} from '@/lib/auth';

const MAX_BIO_LENGTH = 500;

export default function ProfilPage() {
  const { profile, session, loading, refreshProfile } = useProfile();
  const [fullName, setFullName] = useState('');
  const [tingkatan, setTingkatan] = useState<Tingkatan>('bantara');
  const [jabatan, setJabatan] = useState<Jabatan>('anggota');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [motto, setMotto] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) {
      setFullName('');
      setTingkatan('bantara');
      setJabatan('anggota');
      setBio('');
      setInstagram('');
      setMotto('');
      return;
    }
    setFullName(profile.full_name ?? '');
    setTingkatan(profile.tingkatan ?? 'bantara');
    setJabatan(profile.jabatan ?? 'anggota');
    setBio(profile.bio ?? '');
    setInstagram(profile.instagram ?? '');
    setMotto(profile.motto ?? '');
  }, [profile]);

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
          tingkatan,
          jabatan,
          bio: bio.trim().length > 0 ? bio.trim() : null,
          instagram: instagram.trim().length > 0 ? instagram.trim() : null,
          motto: motto.trim().length > 0 ? motto.trim() : null,
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
      <div className="px-4 py-16 lg:px-6 text-sm text-slate-400">
        Memuat data profil...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 py-16 lg:px-6 text-sm text-slate-400">
        Kamu belum masuk. Silakan kembali ke{' '}
        <Link href="/" className="font-semibold text-emerald-400 underline">
          halaman utama
        </Link>{' '}
        untuk login terlebih dahulu.
      </div>
    );
  }

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-6 sm:rounded-3xl sm:px-6 sm:py-8 lg:px-10">
        <div className="flex flex-col gap-2 sm:gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400 sm:text-xs sm:tracking-[0.35em]">
              Profil Anggota
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-50 sm:mt-2 sm:text-2xl">Data Pribadi Diporani</h1>
            <p className="mt-0.5 text-xs text-slate-400 sm:mt-1 sm:text-sm">
              Perbarui informasi profil agar mudah koordinasi.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-400 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
            <p className="truncate">Email: <span className="font-mono text-[10px] text-slate-500 sm:text-xs">{session.user.email}</span></p>
            <p>Peran: <span className="font-semibold text-slate-200">{profile ? ROLE_LABELS[profile.role] : 'Belum ditetapkan'}</span></p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 sm:mt-8 sm:space-y-6">
          <div className="space-y-1 sm:space-y-1.5">
            <label className="text-xs font-medium text-slate-300 sm:text-sm" htmlFor="full-name-input">
              Nama Lengkap
            </label>
            <input
              id="full-name-input"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Contoh: Dian Pramuka Tirta"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:rounded-2xl sm:px-4 sm:text-sm"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-xs font-medium text-slate-300 sm:text-sm" htmlFor="tingkatan-select">
                Tingkatan
              </label>
              <select
                id="tingkatan-select"
                value={tingkatan}
                onChange={(event) => setTingkatan(event.target.value as Tingkatan)}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:rounded-2xl sm:px-4 sm:text-sm"
              >
                {TINGKATAN_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {TINGKATAN_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-xs font-medium text-slate-300 sm:text-sm" htmlFor="jabatan-select">
                Jabatan Sangga
              </label>
              <select
                id="jabatan-select"
                value={jabatan}
                onChange={(event) => setJabatan(event.target.value as Jabatan)}
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:rounded-2xl sm:px-4 sm:text-sm"
              >
                {JABATAN_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {JABATAN_LABELS[item]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-xs font-medium text-slate-300 sm:text-sm">Peran Dashboard</label>
              <input
                value={profile ? ROLE_LABELS[profile.role] : 'Menunggu verifikasi'}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-500 sm:rounded-2xl sm:px-4 sm:text-sm"
              />
            </div>
            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-xs font-medium text-slate-300 sm:text-sm" htmlFor="instagram-input">
                Instagram
              </label>
              <input
                id="instagram-input"
                type="text"
                value={instagram}
                onChange={(event) => setInstagram(event.target.value)}
                placeholder="@username"
                className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:rounded-2xl sm:px-4 sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-1 sm:space-y-1.5">
            <label className="text-xs font-medium text-slate-300 sm:text-sm" htmlFor="motto-input">
              Motto / Kata-kata Favorit
            </label>
            <input
              id="motto-input"
              type="text"
              value={motto}
              onChange={(event) => setMotto(event.target.value)}
              placeholder="Contoh: Satyaku kudarmakan, darmaku kubaktikan"
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:rounded-2xl sm:px-4 sm:text-sm"
            />
          </div>

          <div className="space-y-1 sm:space-y-1.5">
            <label className="text-xs font-medium text-slate-300 sm:text-sm" htmlFor="bio-textarea">
              Informasi Tambahan
            </label>
            <textarea
              id="bio-textarea"
              value={bio}
              onChange={(event) => {
                const next = event.target.value.slice(0, MAX_BIO_LENGTH);
                setBio(next);
              }}
              placeholder="Nomor kontak, regu, catatan penting..."
              rows={3}
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:rounded-2xl sm:px-4 sm:text-sm"
            />
            <p className="text-[10px] text-slate-500 sm:text-xs">{bio.length}/{MAX_BIO_LENGTH} karakter</p>
          </div>

          {status && (
            <div className={`rounded-xl border px-3 py-2 text-xs sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm ${
              status.includes('berhasil') 
                ? 'border-emerald-700/50 bg-emerald-900/30 text-emerald-400'
                : 'border-amber-700/50 bg-amber-900/30 text-amber-400'
            }`}>
              {status}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-slate-500 sm:text-xs">
              Data disimpan ke Supabase.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700 sm:w-auto sm:px-5 sm:text-sm"
            >
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
