'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { PANGKAT_LABELS, ROLE_LABELS, type DashboardProfile } from '@/lib/auth';

type SortField = 'created_at' | 'full_name' | 'role';
type SortOrder = 'asc' | 'desc';

export default function AnggotaPage() {
  const { profile, session, loading } = useProfile();
  const [members, setMembers] = useState<DashboardProfile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<DashboardProfile[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;

    const fetchMembers = async () => {
      setFetching(true);
      setError(null);
      try {
        const response = await fetch('/api/members', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          setError(data?.error ?? 'Gagal memuat daftar anggota');
          return;
        }

        const data = await response.json();
        setMembers(data.members || []);
      } catch (err) {
        console.error('Fetch members error:', err);
        setError('Terjadi kesalahan saat memuat daftar anggota');
      } finally {
        setFetching(false);
      }
    };

    fetchMembers();
  }, [session]);

  useEffect(() => {
    let result = [...members];

    // Filter berdasarkan search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (member) =>
          member.full_name?.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          ROLE_LABELS[member.role].toLowerCase().includes(query) ||
          PANGKAT_LABELS[member.pangkat].toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let compareValue = 0;

      if (sortField === 'created_at') {
        compareValue = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === 'full_name') {
        compareValue = (a.full_name ?? '').localeCompare(b.full_name ?? '');
      } else if (sortField === 'role') {
        compareValue = ROLE_LABELS[a.role].localeCompare(ROLE_LABELS[b.role]);
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredMembers(result);
  }, [members, sortField, sortOrder, searchQuery]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-slate-600">
        Memuat data...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-slate-600">
        Kamu belum masuk. Silakan kembali ke{' '}
        <Link href="/" className="font-semibold text-emerald-600 underline">
          halaman utama
        </Link>{' '}
        untuk login terlebih dahulu.
      </div>
    );
  }

  if (profile?.role !== 'admin' && profile?.role !== 'bph') {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-sm text-slate-600">
        Halaman ini hanya bisa diakses oleh Admin atau BPH.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
          Manajemen Anggota
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Daftar Anggota Diporani</h1>
        <p className="mt-1 text-sm text-slate-600">
          Kelola dan pantau semua anggota yang terdaftar di sistem
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Cari nama, email, role, atau pangkat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => toggleSort('created_at')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                sortField === 'created_at'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tanggal {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('full_name')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                sortField === 'full_name'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Nama {sortField === 'full_name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('role')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                sortField === 'role'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Role {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Menampilkan {filteredMembers.length} dari {members.length} anggota
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {fetching ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-600 shadow-sm">
          Memuat daftar anggota...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-600 shadow-sm">
          {searchQuery ? 'Tidak ada anggota yang cocok dengan pencarian' : 'Belum ada anggota terdaftar'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {member.full_name || 'Nama belum diisi'}
                    </h3>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {ROLE_LABELS[member.role]}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Pangkat:</span>
                      {PANGKAT_LABELS[member.pangkat]}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Email:</span>
                      <span className="font-mono text-xs">{member.email}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Bergabung:</span>
                      {formatDate(member.created_at)}
                    </span>
                  </div>
                  {member.bio && (
                    <p className="mt-2 text-sm text-slate-500 line-clamp-2">{member.bio}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
