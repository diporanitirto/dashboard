'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { canAccessSection } from '@/lib/auth';
import { ConfirmModal } from '@/components/ConfirmModal';

interface Documentation {
  id: string;
  title: string;
  description?: string;
  category?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  filePath?: string;
  createdAt?: string;
  uploader?: {
    name: string | null;
    role: string | null;
  } | null;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getFileIcon = (fileType?: string) => {
  if (!fileType) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('video')) return '🎬';
  return '📄';
};

const isImageFile = (fileType?: string) => {
  return fileType?.includes('image') ?? false;
};

const CATEGORY_OPTIONS = [
  { value: 'foto', label: 'Foto', icon: '📷' },
  { value: 'video', label: 'Video', icon: '🎥' },
  { value: 'lainnya', label: 'Lainnya', icon: '📁' },
];

export default function DokumentasiPage() {
  const { profile, session, loading } = useProfile();
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; doc: Documentation | null }>({
    open: false,
    doc: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('foto');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/dokumentasi', {
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

  useEffect(() => {
    if (session) {
      fetchDocs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Preview for image files
  useEffect(() => {
    if (file && file.type.includes('image')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }, [file]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !file) return;

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('file', file);

      const response = await fetch('/api/dokumentasi', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setUploadSuccess('Dokumentasi berhasil diupload!');
        setTitle('');
        setDescription('');
        setCategory('foto');
        setFile(null);
        setPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setShowForm(false);
        fetchDocs();
      } else {
        const data = await response.json();
        setUploadError(data.error || 'Gagal mengupload dokumentasi.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Terjadi kesalahan saat mengupload.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!session || !deleteModal.doc) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/dokumentasi?id=${deleteModal.doc.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== deleteModal.doc?.id));
        setDeleteModal({ open: false, doc: null });
      } else {
        const data = await response.json();
        alert(data.error || 'Gagal menghapus dokumentasi.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Terjadi kesalahan saat menghapus.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDocs = filterCategory === 'all' 
    ? docs 
    : docs.filter((d) => d.category === filterCategory);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-sm text-slate-500">Memuat...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 py-16 lg:px-6">
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

  if (!profile || !canAccessSection(profile.role, 'dokumentasi')) {
    return (
      <div className="px-4 py-16 lg:px-6">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
          <p className="font-semibold">Akses Terbatas</p>
          <p className="mt-1 text-amber-300/80">
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
    <div className="px-4 py-8 lg:px-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
          Dokumentasi
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-100">
          Galeri Dokumentasi Kegiatan
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Unggah dan kelola foto serta video kegiatan pramuka.
        </p>
      </div>

      {/* Success/Error Messages */}
      {uploadSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {uploadSuccess}
        </div>
      )}

      {/* Upload Button / Form Toggle */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Upload Dokumentasi
        </button>
      ) : (
        /* Upload Form */
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Upload Dokumentasi Baru</h2>
            <button
              onClick={() => {
                setShowForm(false);
                setUploadError('');
                setPreview(null);
              }}
              className="text-slate-500 hover:text-slate-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {uploadError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {uploadError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Judul <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Contoh: Dokumentasi Perkemahan Sabtu Minggu"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                  Kategori
                </label>
                <div className="flex gap-2">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCategory(opt.value)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                        category === opt.value
                          ? 'bg-emerald-500 text-emerald-950'
                          : 'border border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                Deskripsi
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Deskripsi singkat tentang dokumentasi ini..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                File <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required
                    accept="image/*,video/*"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-500/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-400 hover:file:bg-emerald-500/30"
                  />
                  {file && (
                    <p className="mt-2 text-xs text-slate-500">
                      File dipilih: {file.name} ({formatFileSize(file.size)})
                    </p>
                  )}
                </div>
                {preview && (
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-700">
                    <Image
                      src={preview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isUploading || !title || !file}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setUploadError('');
                  setTitle('');
                  setDescription('');
                  setCategory('foto');
                  setFile(null);
                  setPreview(null);
                }}
                className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filterCategory === 'all'
                ? 'bg-emerald-500 text-emerald-950'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Semua
          </button>
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilterCategory(opt.value)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                filterCategory === opt.value
                  ? 'bg-emerald-500 text-emerald-950'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* View Mode */}
        <div className="flex rounded-lg border border-slate-700 bg-slate-800 p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              viewMode === 'grid' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              viewMode === 'list' ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Documentation Gallery */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          Galeri Dokumentasi ({filteredDocs.length})
        </h2>

        {loadingDocs ? (
          <div className="py-8 text-center text-sm text-slate-500">
            <svg className="mx-auto h-6 w-6 animate-spin text-slate-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2">Memuat galeri dokumentasi...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/50 py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-sm text-slate-500">
              {filterCategory === 'all' ? 'Belum ada dokumentasi yang diupload.' : 'Tidak ada dokumentasi untuk kategori ini.'}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Upload dokumentasi pertama →
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-800/50 transition hover:border-slate-700"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-slate-900">
                  {isImageFile(doc.fileType) && doc.fileUrl ? (
                    <Image
                      src={doc.fileUrl}
                      alt={doc.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">
                      {getFileIcon(doc.fileType)}
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute left-2 top-2">
                    <span className="rounded-full bg-slate-900/80 px-2 py-1 text-xs font-medium text-slate-300 backdrop-blur-sm">
                      {CATEGORY_OPTIONS.find((c) => c.value === doc.category)?.icon}{' '}
                      {CATEGORY_OPTIONS.find((c) => c.value === doc.category)?.label || 'Foto'}
                    </span>
                  </div>
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/80 opacity-0 transition group-hover:opacity-100">
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-emerald-950 transition hover:bg-emerald-400"
                        title="Lihat"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                    )}
                    <button
                      onClick={() => setDeleteModal({ open: true, doc })}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-400"
                      title="Hapus"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-100 line-clamp-1">{doc.title}</h3>
                  {doc.description && (
                    <p className="mt-1 text-xs text-slate-400 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-800/50 p-4 transition hover:border-slate-700"
              >
                {/* Thumbnail */}
                <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-slate-900">
                  {isImageFile(doc.fileType) && doc.fileUrl ? (
                    <Image
                      src={doc.fileUrl}
                      alt={doc.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">
                      {getFileIcon(doc.fileType)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-2">
                    <h3 className="font-semibold text-slate-100">{doc.title}</h3>
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                      {CATEGORY_OPTIONS.find((c) => c.value === doc.category)?.label || 'Foto'}
                    </span>
                  </div>
                  {doc.description && (
                    <p className="mt-1 text-sm text-slate-400 line-clamp-1">{doc.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{formatDate(doc.createdAt)}</span>
                    {doc.uploader?.name && (
                      <>
                        <span>•</span>
                        <span>oleh {doc.uploader.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-slate-400 transition hover:bg-emerald-500/20 hover:text-emerald-400"
                      title="Lihat"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => setDeleteModal({ open: true, doc })}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-700 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400"
                    title="Hapus"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        title="Hapus Dokumentasi"
        message={`Apakah Anda yakin ingin menghapus "${deleteModal.doc?.title}"? File akan dihapus permanen.`}
        confirmLabel={isDeleting ? 'Menghapus...' : 'Hapus'}
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ open: false, doc: null })}
      />
    </div>
  );
}
