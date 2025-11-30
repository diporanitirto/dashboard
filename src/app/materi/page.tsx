'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/components/ProfileProvider';
import { ConfirmModal } from '@/components/ConfirmModal';

interface Materi {
  id: string;
  title: string;
  description: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
}

export default function MateriPage() {
  const { profile, session, loading: profileLoading } = useProfile();
  const [materials, setMaterials] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedMateri, setSelectedMateri] = useState<Materi | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string; title: string }>({
    show: false,
    id: '',
    title: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    file: null as File | null
  });
  const [submitting, setSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const canManageMateri = profile?.role === 'admin' || profile?.role === 'materi';
  const canDeleteMateri = profile?.role === 'admin' || profile?.role === 'materi' || profile?.role === 'bph';

  useEffect(() => {
    if (session) {
      fetchMaterials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchMaterials = async () => {
    try {
      const res = await fetch('/api/materi', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      const data = await res.json();
      if (data.data) {
        setMaterials(data.data);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Judul dan konten harus diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('title', formData.title);
      form.append('description', formData.description);
      form.append('content', formData.content);
      if (formData.file) {
        form.append('file', formData.file);
      }
      if (editMode && editId) {
        form.append('id', editId);
        form.append('_method', 'PUT');
      }

      const res = await fetch('/api/materi', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: form
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({ title: '', description: '', content: '', file: null });
        setEditMode(false);
        setEditId(null);
        fetchMaterials();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menyimpan materi');
      }
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Gagal menyimpan materi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/materi?id=${deleteModal.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (res.ok) {
        fetchMaterials();
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus materi');
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      alert('Gagal menghapus materi');
    } finally {
      setDeleteModal({ show: false, id: '', title: '' });
    }
  };

  const handleView = (materi: Materi) => {
    setSelectedMateri(materi);
    setShowViewModal(true);
  };

  const handleEdit = (materi: Materi) => {
    setFormData({
      title: materi.title,
      description: materi.description || '',
      content: materi.content || '',
      file: null
    });
    setEditMode(true);
    setEditId(materi.id);
    setShowAddModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (profileLoading || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
          <p className="mt-3 text-sm text-slate-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 lg:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-400">
            Materi
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-100">
            Materi Pramuka
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Kelola dan akses materi pembelajaran pramuka.
          </p>
        </div>
        {canManageMateri && (
          <button
            onClick={() => {
              setFormData({ title: '', description: '', content: '', file: null });
              setEditMode(false);
              setEditId(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Tambah Materi
          </button>
        )}
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <h3 className="mt-4 text-xl font-semibold text-white">Belum Ada Materi</h3>
          <p className="mt-2 text-slate-400">
            {canManageMateri 
              ? 'Mulai tambahkan materi pembelajaran untuk anggota pramuka.'
              : 'Belum ada materi yang tersedia saat ini.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((materi) => (
            <div
              key={materi.id}
              className="group rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleView(materi)}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Lihat Materi"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  {canManageMateri && (
                    <button
                      onClick={() => handleEdit(materi)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Materi"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  )}
                  {canDeleteMateri && (
                    <button
                      onClick={() => setDeleteModal({ show: true, id: materi.id, title: materi.title })}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Hapus Materi"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{materi.title}</h3>
              {materi.description && (
                <p className="text-slate-400 text-sm mb-3 line-clamp-2">{materi.description}</p>
              )}
              
              <div className="text-slate-500 text-sm mb-3 line-clamp-3">
                {truncateContent(materi.content)}
              </div>
              
              {materi.file_url && (
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 p-2 bg-slate-800/50 rounded-lg">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="truncate">{materi.file_name}</span>
                  <span className="text-slate-600">({formatFileSize(materi.file_size)})</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-xs text-slate-500">{formatDate(materi.created_at)}</span>
                <button
                  onClick={() => handleView(materi)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Baca Selengkapnya →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">
                {editMode ? 'Edit Materi' : 'Tambah Materi Baru'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditMode(false);
                  setEditId(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Judul Materi <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Masukkan judul materi"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deskripsi Singkat
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Deskripsi singkat tentang materi ini"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Konten Materi <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                  placeholder="Tulis konten materi di sini..."
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tulis konten materi lengkap. Gunakan paragraf baru untuk memisahkan bagian.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  File Lampiran (Opsional)
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center px-4 py-6 bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                    <div className="text-center">
                      <svg className="h-8 w-8 text-slate-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="text-sm text-slate-400">
                        {formData.file ? formData.file.name : 'Pilih file lampiran (PDF, DOC, dll)'}
                      </span>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                    />
                  </label>
                </div>
                {formData.file && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-slate-800 rounded-lg">
                    <span className="text-sm text-slate-300 truncate">{formData.file.name}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, file: null })}
                      className="text-red-400 hover:text-red-300"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditMode(false);
                    setEditId(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-emerald-500 text-emerald-950 font-semibold rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Menyimpan...' : (editMode ? 'Simpan Perubahan' : 'Simpan Materi')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedMateri && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white line-clamp-1">{selectedMateri.title}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-5">
              {selectedMateri.description && (
                <p className="text-slate-400 mb-4">{selectedMateri.description}</p>
              )}
              
              <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedMateri.content}
                </div>
              </div>
              
              {selectedMateri.file_url && (
                <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-400 mb-2">File Lampiran</h4>
                  <a
                    href={selectedMateri.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{selectedMateri.file_name}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(selectedMateri.file_size)}</p>
                    </div>
                  </a>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between text-sm text-slate-500">
                <span>Diupload pada {formatDate(selectedMateri.created_at)}</span>
                <span>Oleh: {selectedMateri.uploaded_by}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.show}
        title="Hapus Materi"
        message={`Apakah Anda yakin ingin menghapus materi "${deleteModal.title}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        onConfirm={handleDelete}
        onClose={() => setDeleteModal({ show: false, id: '', title: '' })}
      />
    </div>
  );
}
