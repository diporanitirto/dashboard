'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useProfile } from '@/components/ProfileProvider';
import Loading from '@/components/Loading';

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

type Post = {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string;
  created_at: string;
  profiles: Profile;
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  bph: 'BPH',
  materi: 'Sie. Materi',
  media: 'Sie. Media',
  anggota: 'Anggota',
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('');
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Baru saja';
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function PostsPage() {
  const { profile, session, loading: profileLoading } = useProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran file terlalu besar. Maksimal 5MB.');
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleCreatePost = async () => {
    if (!selectedImage) {
      setError('Pilih gambar terlebih dahulu');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat postingan');
      }

      // Add new post to the top of the list
      setPosts((prev) => [data.post, ...prev]);
      
      // Reset form
      setShowCreateModal(false);
      setCaption('');
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat postingan');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Yakin ingin menghapus postingan ini?')) return;

    try {
      const res = await fetch(`/api/posts?id=${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Gagal menghapus postingan');
      }

      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Gagal menghapus postingan');
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setCaption('');
    setSelectedImage(null);
    setPreviewUrl(null);
    setError(null);
  };

  if (profileLoading || loading) {
    return <Loading text="Memuat postingan..." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Postingan</h1>
          <p className="text-sm text-slate-400">Bagikan momen kegiatan Pramuka</p>
        </div>
        {profile && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="hidden sm:inline">Buat Postingan</span>
          </button>
        )}
      </div>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-700/50">
            <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Belum ada postingan</h3>
          <p className="mt-1 text-sm text-slate-400">
            Jadilah yang pertama membagikan momen!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {post.profiles.avatar_url ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={post.profiles.avatar_url}
                        alt={post.profiles.full_name || 'User'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-semibold text-white">
                      {getInitials(post.profiles.full_name)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-white">
                      {post.profiles.full_name || 'Tanpa Nama'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {ROLE_LABELS[post.profiles.role] || post.profiles.role}
                    </p>
                  </div>
                </div>
                
                {/* Delete button for own posts or admin */}
                {profile && (post.user_id === profile.id || profile.role === 'admin') && (
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700/50 hover:text-red-400"
                    title="Hapus postingan"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Post Image */}
              <div className="relative aspect-square bg-slate-900">
                <Image
                  src={post.image_url}
                  alt={post.caption || 'Post image'}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Post Content */}
              <div className="p-4">
                {post.caption && (
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    <span className="font-semibold text-white">
                      {post.profiles.full_name || 'Tanpa Nama'}
                    </span>{' '}
                    {post.caption}
                  </p>
                )}
                <p className="mt-2 text-xs text-slate-500">{formatDate(post.created_at)}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-slate-800 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3 flex-shrink-0">
              <h2 className="text-lg font-semibold text-white">Buat Postingan Baru</h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-700 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Image Preview/Upload */}
              {previewUrl ? (
                <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-900">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-video w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/50 transition hover:border-slate-500 hover:bg-slate-900"
                >
                  <svg className="mb-2 h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  <p className="text-sm text-slate-400">Klik untuk pilih gambar</p>
                  <p className="mt-1 text-xs text-slate-500">JPG, PNG, WebP, GIF (max 5MB)</p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageSelect}
                className="hidden"
              />

              {/* Caption */}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Tulis caption... (opsional)"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />

              {/* Error */}
              {error && (
                <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-700 px-4 py-3 flex-shrink-0">
              <button
                onClick={closeModal}
                disabled={uploading}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:text-white disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!selectedImage || uploading}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Mengunggah...
                  </>
                ) : (
                  'Posting'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
