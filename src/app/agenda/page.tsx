'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { ConfirmModal } from '@/components/ConfirmModal';

interface Agenda {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  createdAt?: string;
  author?: {
    name: string | null;
    role: string | null;
  } | null;
}

const formatTime = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getRelativeTime = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: 'Sudah lewat', color: 'text-slate-500' };
  if (diffDays === 0) return { label: 'Hari ini', color: 'text-emerald-400' };
  if (diffDays === 1) return { label: 'Besok', color: 'text-amber-400' };
  if (diffDays <= 7) return { label: `${diffDays} hari lagi`, color: 'text-blue-400' };
  return { label: `${diffDays} hari lagi`, color: 'text-slate-400' };
};

const isUpcoming = (dateString: string) => {
  return new Date(dateString) >= new Date();
};

export default function AgendaPage() {
  const { profile, session, loading } = useProfile();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loadingAgendas, setLoadingAgendas] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; agenda: Agenda | null }>({
    open: false,
    agenda: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const canCreate = profile?.role === 'bph' || profile?.role === 'admin';

  const fetchAgendas = async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/agenda', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAgendas(data as Agenda[]);
      }
    } catch (error) {
      console.error('Failed to fetch agendas:', error);
    } finally {
      setLoadingAgendas(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAgendas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setIsSubmitting(true);
    setFormError('');
    setFormSuccess('');

    try {
      const response = await fetch('/api/agenda', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          location,
          startDate,
          startTime,
          endDate,
          endTime,
        }),
      });

      if (response.ok) {
        setFormSuccess('Agenda berhasil ditambahkan!');
        setTitle('');
        setDescription('');
        setLocation('');
        setStartDate('');
        setStartTime('');
        setEndDate('');
        setEndTime('');
        setShowForm(false);
        fetchAgendas();
      } else {
        const data = await response.json();
        setFormError(data.error || 'Gagal menambahkan agenda.');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setFormError('Terjadi kesalahan saat menambahkan agenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !deleteModal.agenda) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/agenda?id=${deleteModal.agenda.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setAgendas((prev) => prev.filter((a) => a.id !== deleteModal.agenda?.id));
        setDeleteModal({ open: false, agenda: null });
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal menghapus agenda.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Terjadi kesalahan saat menghapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAgendas = agendas.filter((a) => {
    if (filter === 'upcoming') return isUpcoming(a.startsAt);
    if (filter === 'past') return !isUpcoming(a.startsAt);
    return true;
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-slate-500">Memuat...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-8 text-center">
          <p className="text-slate-400">
            Silakan{' '}
            <Link href="/" className="font-semibold text-emerald-400 underline">
              login
            </Link>{' '}
            terlebih dahulu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
          Agenda
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">
          Jadwal Kegiatan Pramuka
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Lihat dan kelola agenda kegiatan yang akan datang.
        </p>
      </div>

      {/* Success Message */}
      {formSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {formSuccess}
        </div>
      )}

      {/* Add Button / Form */}
      {canCreate && (
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="mb-8 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Agenda
            </button>
          ) : (
            <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Tambah Agenda Baru</h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setFormError('');
                  }}
                  className="text-slate-500 hover:text-slate-300"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {formError && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Judul Kegiatan <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Contoh: Latihan Rutin Mingguan"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Deskripsi
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Detail kegiatan, tema, atau hal yang perlu dipersiapkan..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Lokasi
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Lapangan Sekolah"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Tanggal Mulai <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Waktu Mulai
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Waktu Selesai
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !title || !startDate}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Simpan
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormError('');
                      setTitle('');
                      setDescription('');
                      setLocation('');
                      setStartDate('');
                      setStartTime('');
                      setEndDate('');
                      setEndTime('');
                    }}
                    className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('upcoming')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'upcoming'
              ? 'bg-emerald-500 text-emerald-950'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Akan Datang
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'past'
              ? 'bg-emerald-500 text-emerald-950'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Sudah Lewat
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-emerald-500 text-emerald-950'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Semua
        </button>
      </div>

      {/* Agenda List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          Daftar Agenda ({filteredAgendas.length})
        </h2>

        {loadingAgendas ? (
          <div className="py-8 text-center text-sm text-slate-500">
            <svg className="mx-auto h-6 w-6 animate-spin text-slate-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2">Memuat daftar agenda...</p>
          </div>
        ) : filteredAgendas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/50 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-sm text-slate-500">
              {filter === 'upcoming'
                ? 'Tidak ada agenda yang akan datang.'
                : filter === 'past'
                ? 'Tidak ada agenda yang sudah lewat.'
                : 'Belum ada agenda.'}
            </p>
            {canCreate && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                Tambah agenda pertama →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAgendas.map((agenda) => {
              const relative = getRelativeTime(agenda.startsAt);
              const isPast = !isUpcoming(agenda.startsAt);

              return (
                <div
                  key={agenda.id}
                  className={`group rounded-xl border p-4 transition ${
                    isPast
                      ? 'border-slate-800 bg-slate-800/30'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Date Box */}
                    <div className={`flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl ${
                      isPast ? 'bg-slate-800' : 'bg-emerald-500/10'
                    }`}>
                      <span className={`text-lg font-bold ${isPast ? 'text-slate-500' : 'text-emerald-400'}`}>
                        {new Date(agenda.startsAt).getDate()}
                      </span>
                      <span className={`text-xs uppercase ${isPast ? 'text-slate-600' : 'text-emerald-500/80'}`}>
                        {new Date(agenda.startsAt).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-semibold ${isPast ? 'text-slate-400' : 'text-slate-100'}`}>
                            {agenda.title}
                          </h3>
                          <span className={`text-xs font-medium ${relative.color}`}>
                            {relative.label}
                          </span>
                        </div>
                        {canCreate && (
                          <button
                            onClick={() => setDeleteModal({ open: true, agenda })}
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-700 text-slate-500 opacity-0 transition hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
                            title="Hapus"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {agenda.description && (
                        <p className={`mt-1 text-sm line-clamp-2 ${isPast ? 'text-slate-500' : 'text-slate-400'}`}>
                          {agenda.description}
                        </p>
                      )}

                      <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${isPast ? 'text-slate-600' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(agenda.startsAt)}
                          {agenda.endsAt && ` - ${formatTime(agenda.endsAt)}`}
                        </span>
                        {agenda.location && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {agenda.location}
                          </span>
                        )}
                        {agenda.author?.name && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {agenda.author.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        title="Hapus Agenda"
        message={`Apakah Anda yakin ingin menghapus agenda "${deleteModal.agenda?.title}"?`}
        confirmLabel={isDeleting ? 'Menghapus...' : 'Hapus'}
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ open: false, agenda: null })}
      />
    </div>
  );
}
