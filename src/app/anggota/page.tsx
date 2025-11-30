'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { 
  ROLE_LABELS, 
  TINGKATAN_LABELS,
  JABATAN_LABELS,
  TINGKATAN_OPTIONS,
  JABATAN_OPTIONS,
  type DashboardProfile,
} from '@/lib/auth';

type SortField = 'created_at' | 'full_name' | 'role';
type SortOrder = 'asc' | 'desc';

const ROLE_OPTIONS = [
  { value: 'anggota', label: 'Anggota' },
  { value: 'materi', label: 'Tim Materi' },
  { value: 'media', label: 'Tim Media' },
  { value: 'bph', label: 'BPH' },
  { value: 'admin', label: 'Admin' },
] as const;

export default function AnggotaPage() {
  const { profile, session, loading } = useProfile();
  const [members, setMembers] = useState<DashboardProfile[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<DashboardProfile[]>([]);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [editModal, setEditModal] = useState<{ open: boolean; member: DashboardProfile | null }>({
    open: false,
    member: null,
  });
  const [editRole, setEditRole] = useState('');
  const [editTingkatan, setEditTingkatan] = useState('');
  const [editJabatan, setEditJabatan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

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
          ROLE_LABELS[member.role].toLowerCase().includes(query)
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

  const openEditModal = (member: DashboardProfile) => {
    setEditModal({ open: true, member });
    setEditRole(member.role);
    const ext = member as DashboardProfile & { tingkatan?: string; jabatan?: string };
    setEditTingkatan(ext.tingkatan || 'bantara');
    setEditJabatan(ext.jabatan || 'anggota');
  };

  const closeEditModal = () => {
    setEditModal({ open: false, member: null });
    setEditRole('');
    setEditTingkatan('');
    setEditJabatan('');
  };

  const handleSaveEdit = async () => {
    if (!session || !editModal.member) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/members', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editModal.member.id,
          role: editRole,
          tingkatan: editTingkatan,
          jabatan: editJabatan,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setMembers((prev) =>
          prev.map((m) =>
            m.id === editModal.member?.id
              ? { ...m, role: data.member.role, tingkatan: data.member.tingkatan, jabatan: data.member.jabatan }
              : m
          )
        );
        setSaveSuccess(`Berhasil memperbarui ${editModal.member.full_name || 'anggota'}`);
        closeEditModal();
        setTimeout(() => setSaveSuccess(''), 3000);
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal memperbarui anggota.');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Terjadi kesalahan saat menyimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-16 lg:px-6 text-sm text-slate-400">
        Memuat data...
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

  if (profile?.role !== 'admin' && profile?.role !== 'bph') {
    return (
      <div className="px-4 py-16 lg:px-6 text-sm text-slate-400">
        Halaman ini hanya bisa diakses oleh Admin atau BPH.
      </div>
    );
  }

  return (
    <div className="px-4 py-6 lg:px-6">
      <div className="mb-4 sm:mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-400 sm:text-xs sm:tracking-[0.35em]">
          Manajemen Anggota
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-50 sm:mt-2 sm:text-3xl">Daftar Anggota Diporani</h1>
        <p className="mt-0.5 text-xs text-slate-400 sm:mt-1 sm:text-sm">
          Kelola dan pantau semua anggota terdaftar
        </p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 sm:mb-6">
          {saveSuccess}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="mb-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4 sm:mb-6 sm:rounded-3xl sm:p-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="Cari nama, email, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 sm:rounded-2xl sm:px-4 sm:text-sm"
          />
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              onClick={() => toggleSort('created_at')}
              className={`rounded-full px-2.5 py-1.5 text-[10px] font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                sortField === 'created_at'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              Tanggal {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('full_name')}
              className={`rounded-full px-2.5 py-1.5 text-[10px] font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                sortField === 'full_name'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              Nama {sortField === 'full_name' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('role')}
              className={`rounded-full px-2.5 py-1.5 text-[10px] font-medium transition sm:px-4 sm:py-2 sm:text-sm ${
                sortField === 'role'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              Role {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-500 sm:mt-3 sm:text-xs">
          {filteredMembers.length} dari {members.length} anggota
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-700/50 bg-red-900/30 px-3 py-2 text-xs text-red-400 sm:mb-6 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
          {error}
        </div>
      )}

      {fetching ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center text-xs text-slate-400 sm:rounded-3xl sm:p-12 sm:text-sm">
          Memuat daftar anggota...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-8 text-center text-xs text-slate-400 sm:rounded-3xl sm:p-12 sm:text-sm">
          {searchQuery ? 'Tidak ada anggota yang cocok' : 'Belum ada anggota terdaftar'}
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="group rounded-2xl border border-slate-700 bg-slate-900/60 p-4 transition hover:border-slate-600 sm:rounded-3xl sm:p-6"
            >
              <div className="flex flex-col gap-2 sm:gap-4">
                <div className="flex flex-wrap items-start justify-between gap-2 sm:items-center sm:gap-3">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="text-base font-semibold text-slate-100 sm:text-lg">
                      {member.full_name || 'Nama belum diisi'}
                    </h3>
                    <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 sm:px-3 sm:py-1 sm:text-xs">
                      {ROLE_LABELS[member.role]}
                    </span>
                    {(() => {
                      return (
                        <>
                          {member.tingkatan && (
                            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300 sm:px-3 sm:py-1 sm:text-xs">
                              {TINGKATAN_LABELS[member.tingkatan] || 'Penegak'}
                            </span>
                          )}
                          {member.jabatan && member.jabatan !== 'anggota' && (
                            <span className="rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-semibold text-amber-400 sm:px-3 sm:py-1 sm:text-xs">
                              {JABATAN_LABELS[member.jabatan] || member.jabatan}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  {profile?.role === 'admin' && (
                    <button
                      onClick={() => openEditModal(member)}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-emerald-500/20 hover:text-emerald-400 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1 text-xs text-slate-400 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1 sm:text-sm">
                  <span className="flex items-center gap-1 truncate">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate font-mono text-[10px] sm:text-xs">{member.email}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Bergabung {formatDate(member.created_at)}
                  </span>
                </div>
                {member.bio && (
                  <p className="text-xs text-slate-500 line-clamp-2 sm:text-sm">{member.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Edit Anggota</h2>
              <button
                onClick={closeEditModal}
                className="text-slate-500 hover:text-slate-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-400">
                {editModal.member.full_name || 'Anggota'}
              </p>
              <p className="text-xs text-slate-500">{editModal.member.email}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Role / Jabatan
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Tingkatan
                </label>
                <select
                  value={editTingkatan}
                  onChange={(e) => setEditTingkatan(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {TINGKATAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {TINGKATAN_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Jabatan Sangga
                </label>
                <select
                  value={editJabatan}
                  onChange={(e) => setEditJabatan(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {JABATAN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {JABATAN_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  'Simpan'
                )}
              </button>
              <button
                onClick={closeEditModal}
                className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
