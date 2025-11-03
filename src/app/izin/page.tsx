'use client';

import { useCallback, useEffect, useMemo, useState, type SVGProps } from 'react';
import Link from 'next/link';
import { Izin, supabase } from '@/lib/supabase';
import { IzinTable } from '@/components/IzinTable';
import { ClassDistribution } from '@/components/ClassDistribution';
import { RecentActivity } from '@/components/RecentActivity';
import { ConfirmModal } from '@/components/ConfirmModal';
import Loading from '@/components/Loading';

type StatusFilter = 'all' | 'pending' | 'approved';

const statusOptions: Array<{ key: StatusFilter; label: string }> = [
	{ key: 'all', label: 'Semua' },
	{ key: 'pending', label: 'Pending' },
	{ key: 'approved', label: 'Diizinkan' },
];

const kelasOptions = ['X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8'];

type ConfirmAction = {
	type: 'approve' | 'delete';
	izin: Izin;
};

const LockIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M8 11V8.5a4 4 0 1 1 8 0V11m-9 0h10a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-7a1 1 0 0 1 1-1Z"
		/>
	</svg>
);

const RefreshIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			d="M4 4v5h5M20 20v-5h-5M5 9a7 7 0 0 1 11-5.45M19 15a7 7 0 0 1-11 5.45"
		/>
	</svg>
);

export default function IzinDashboard() {
	const [izinList, setIzinList] = useState<Izin[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
	const [kelasFilter, setKelasFilter] = useState<string[]>([]);
	const [search, setSearch] = useState('');
	const [busyId, setBusyId] = useState<string | null>(null);
	const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
	const [tokenInput, setTokenInput] = useState('');
	const [actionToken, setActionToken] = useState('');
	const [tokenValid, setTokenValid] = useState(false);
	const [tokenError, setTokenError] = useState<string | null>(null);
	const [tokenModalView, setTokenModalView] = useState<'activate' | 'manage' | 'error' | null>(null);
	const [showArchived, setShowArchived] = useState(false);

	const verifyAdminToken = useCallback(async (token: string) => {
		try {
			const response = await fetch('/api/token/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ token }),
			});

			if (response.status === 401) {
				return { ok: false, message: 'Your token incorrect.' } as const;
			}

			if (!response.ok) {
				const payload = (await response.json().catch(() => null)) as { error?: string } | null;
				return { ok: false, message: payload?.error ?? 'Gagal memverifikasi token.' } as const;
			}

			return { ok: true } as const;
		} catch (error) {
			console.error('verifyAdminToken error:', error);
			return { ok: false, message: 'Tidak dapat terhubung ke server.' } as const;
		}
	}, []);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const storedToken = window.localStorage.getItem('dashboard-action-token');
		if (!storedToken) return;

		verifyAdminToken(storedToken)
			.then((result) => {
				if (result.ok) {
					setTokenInput(storedToken);
					setActionToken(storedToken);
					setTokenValid(true);
					setTokenError(null);
				} else {
					window.localStorage.removeItem('dashboard-action-token');
				}
			})
			.catch((error) => {
				console.error('Stored token verification failed:', error);
				window.localStorage.removeItem('dashboard-action-token');
			});
	}, [verifyAdminToken]);

	const fetchIzin = useCallback(async () => {
		const response = await fetch(`/api/izin?archived=${showArchived}`);
		if (!response.ok) {
			throw new Error('Gagal memuat data izin');
		}

		const data: Izin[] = await response.json();
		setIzinList(data);
	}, [showArchived]);

	const runArchiveSweep = useCallback(async () => {
		try {
			await fetch('/api/archive', { method: 'POST' });
		} catch (error) {
			console.error('Archive sweep failed:', error);
		}
	}, []);

	useEffect(() => {
		const load = async () => {
			try {
				setLoading(true);
				await runArchiveSweep();
				await fetchIzin();
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [fetchIzin, runArchiveSweep]);

	useEffect(() => {
		const channel = supabase
			.channel('izin-changes')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'izin' }, () => {
				fetchIzin().catch((error: unknown) => console.error('Realtime fetch error:', error));
			});

		channel.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [fetchIzin]);

	const handleRefresh = async () => {
		try {
			setRefreshing(true);
			await runArchiveSweep();
			await fetchIzin();
		} catch (error) {
			console.error(error);
			alert('Gagal memuat ulang data.');
		} finally {
			setRefreshing(false);
		}
	};

	const openTokenModal = () => {
		if (tokenValid) {
			setTokenError(null);
			setTokenModalView('manage');
			return;
		}
		setTokenModalView('activate');
	};

	const closeTokenModal = () => {
		setTokenModalView(null);
		setTokenError(null);
	};

	const markTokenInvalid = (message: string) => {
		setTokenInput('');
		setActionToken('');
		setTokenValid(false);
		setTokenError(message);
		setTokenModalView('error');
		if (typeof window !== 'undefined') {
			window.localStorage.removeItem('dashboard-action-token');
		}
	};

	const handleTokenSubmit = async () => {
		const trimmed = tokenInput.trim();
		if (!trimmed) {
			setTokenError('Token tidak boleh kosong.');
			return;
		}

		const result = await verifyAdminToken(trimmed);
		if (!result.ok) {
			markTokenInvalid(result.message ?? 'Your token incorrect.');
			return;
		}

		setTokenInput(trimmed);
		setActionToken(trimmed);
		setTokenValid(true);
		setTokenError(null);
		setTokenModalView(null);
		if (typeof window !== 'undefined') {
			window.localStorage.setItem('dashboard-action-token', trimmed);
		}
	};

	const handleTokenReset = () => {
		setTokenInput('');
		setActionToken('');
		setTokenValid(false);
		setTokenError(null);
		setTokenModalView(null);
		if (typeof window !== 'undefined') {
			window.localStorage.removeItem('dashboard-action-token');
		}
	};

	const beginTokenEdit = () => {
		setTokenError(null);
		setTokenInput('');
		setTokenModalView('activate');
	};

	const handleApprove = async (id: string) => {
		if (!tokenValid || !actionToken) {
			setTokenError('Aktifkan token admin terlebih dahulu.');
			openTokenModal();
			return;
		}
		try {
			setBusyId(id);
			const response = await fetch(`/api/izin/${id}`, {
				method: 'PATCH',
				headers: {
					'x-action-token': actionToken,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ verifiedBy: 'Judat' }),
			});
			if (response.status === 401) {
				markTokenInvalid('Your token incorrect.');
				return;
			}
			if (!response.ok) {
				throw new Error('Gagal menyetujui izin');
			}
			await fetchIzin();
		} catch (error) {
			console.error(error);
			alert('Gagal menyetujui izin.');
		} finally {
			setBusyId(null);
		}
	};

	const handleDelete = async (id: string) => {
		if (!tokenValid || !actionToken) {
			setTokenError('Aktifkan token admin terlebih dahulu.');
			openTokenModal();
			return;
		}
		try {
			setBusyId(id);
			const response = await fetch(`/api/izin/${id}`, {
				method: 'DELETE',
				headers: {
					'x-action-token': actionToken,
				},
			});
			if (response.status === 401) {
				markTokenInvalid('Your token incorrect.');
				return;
			}
			if (!response.ok) {
				throw new Error('Gagal menghapus izin');
			}
			await fetchIzin();
		} catch (error) {
			console.error(error);
			alert('Gagal menghapus izin.');
		} finally {
			setBusyId(null);
		}
	};

	const openApproveConfirm = (izin: Izin) => {
		if (!tokenValid) {
			setTokenError('Aktifkan token admin terlebih dahulu.');
			openTokenModal();
			return;
		}
		setConfirmAction({ type: 'approve', izin });
	};

	const openDeleteConfirm = (izin: Izin) => {
		if (!tokenValid) {
			setTokenError('Aktifkan token admin terlebih dahulu.');
			openTokenModal();
			return;
		}
		setConfirmAction({ type: 'delete', izin });
	};

	const cancelConfirmation = () => {
		setConfirmAction(null);
	};

	const executeConfirmation = async () => {
		if (!confirmAction) return;
		if (confirmAction.type === 'approve') {
			await handleApprove(confirmAction.izin.id);
		} else {
			await handleDelete(confirmAction.izin.id);
		}
		// Modal will auto-close after showing success
	};

	const toggleKelas = (kelas: string) => {
		setKelasFilter((prev) =>
			prev.includes(kelas) ? prev.filter((item) => item !== kelas) : [...prev, kelas]
		);
	};

	const clearKelasFilter = () => {
		setKelasFilter([]);
	};

	const filteredData = useMemo(() => {
		return izinList.filter((izin) => {
			const matchStatus =
				statusFilter === 'all' ? true : izin.status === statusFilter;
			const matchKelas = kelasFilter.length === 0 ? true : kelasFilter.includes(izin.kelas);
			const keyword = search.trim().toLowerCase();
			const matchKeyword =
				keyword.length === 0
					? true
					: izin.nama.toLowerCase().includes(keyword) ||
						izin.alasan.toLowerCase().includes(keyword);

			return matchStatus && matchKelas && matchKeyword;
		});
	}, [izinList, statusFilter, kelasFilter, search]);

	const pendingCount = useMemo(
		() => izinList.filter((izin) => izin.status === 'pending').length,
		[izinList]
	);

	const approvedCount = useMemo(
		() => izinList.filter((izin) => izin.status === 'approved').length,
		[izinList]
	);

	const totalCount = izinList.length;
	const kelasStats = useMemo(() => {
		const template: Record<string, number> = {
			X1: 0,
			X2: 0,
			X3: 0,
			X4: 0,
			X5: 0,
			X6: 0,
			X7: 0,
			X8: 0,
		};

		izinList.forEach((izin) => {
			template[izin.kelas] = (template[izin.kelas] ?? 0) + 1;
		});

		return template;
	}, [izinList]);

	const recentActivity = useMemo(() => izinList.slice(0, 5), [izinList]);

	return (
		<>
			<div className="min-h-screen bg-slate-100 pb-16">
				<button
					onClick={openTokenModal}
					className={`fixed right-6 top-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
						tokenValid
							? 'border-emerald-400 bg-emerald-400 text-emerald-900 shadow-lg shadow-emerald-200'
							: 'border-emerald-400 bg-white text-emerald-500 hover:bg-emerald-50'
					}`}
					aria-label={tokenValid ? 'Kelola token admin' : 'Aktifkan token admin'}
				>
					<LockIcon className="h-5 w-5" />
				</button>
				<div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
					<section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-200 via-blue-200 to-indigo-200 px-6 py-10 text-slate-800 shadow-2xl sm:px-7 sm:py-12">
						<div className="absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
						<div className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
						<div className="relative z-10 max-w-3xl">
							<span className="inline-flex items-center rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">
								DIPORANI
							</span>
							<h1 className="mt-6 text-4xl font-bold leading-snug text-slate-900 sm:text-5xl">
								Dashboard Rekap Izin DIPORANI
							</h1>
							<div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
								<p>
									Total izin tercatat: <span className="font-semibold text-slate-800">{totalCount}</span>
								</p>
								<p>
									Pending: <span className="font-semibold text-slate-800">{pendingCount}</span>
								</p>
								<p>
									Approved: <span className="font-semibold text-slate-800">{approvedCount}</span>
								</p>
								<Link
									href="/arsip"
									className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-400 hover:text-slate-800"
								>
									Lihat Arsip Mingguan
								</Link>
							</div>
						</div>
					</section>

					<section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
						<div className="space-y-6">
							<div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
								<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
									<div className="flex flex-col items-center gap-4">
										<div className="flex flex-wrap items-center justify-center gap-2 rounded-full bg-slate-100 px-2 py-1">
											{statusOptions.map((option) => (
												<button
													key={option.key}
													onClick={() => setStatusFilter(option.key)}
													className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
														statusFilter === option.key
															? 'bg-sky-300 text-slate-900 shadow-sm'
															: 'text-slate-500 hover:bg-white'
													}`}
												>
													{option.label}
												</button>
											))}
										</div>
										<div className="flex flex-wrap justify-center gap-2 items-center">
											<span className="text-xs font-semibold text-slate-600">Tampilkan:</span>
											<button
												onClick={() => setShowArchived(false)}
												className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
													!showArchived
														? 'border-emerald-300 bg-emerald-100 text-slate-800 shadow-sm'
														: 'border-slate-200 text-slate-500 hover:bg-white'
												}`}
											>
												Data Aktif
											</button>
											<button
												onClick={() => setShowArchived(true)}
												className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
													showArchived
														? 'border-amber-300 bg-amber-100 text-slate-800 shadow-sm'
														: 'border-slate-200 text-slate-500 hover:bg-white'
												}`}
											>
												Data Arsip
											</button>
										</div>
										<div className="flex flex-wrap justify-center gap-2">
											<button
												onClick={clearKelasFilter}
												className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
													kelasFilter.length === 0
														? 'border-sky-300 bg-sky-100 text-slate-800 shadow-sm'
														: 'border-slate-200 text-slate-500 hover:bg-white'
												}`}
											>
												Semua
											</button>
											{kelasOptions.map((kelas) => {
												const active = kelasFilter.includes(kelas);
												return (
													<button
														key={kelas}
														onClick={() => toggleKelas(kelas)}
														className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
															active
																? 'border-sky-300 bg-sky-100 text-slate-800 shadow-sm'
																: 'border-slate-200 text-slate-500 hover:bg-white'
														}`}
													>
														Kelas {kelas}
													</button>
												);
											})}
										</div>
									</div>
									<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
										<div className="relative w-full sm:w-auto">
											<input
												type="search"
												value={search}
												onChange={(event) => setSearch(event.target.value)}
												placeholder="Cari nama atau alasan..."
												className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-300 sm:w-64"
											/>
										</div>
										<button
											onClick={handleRefresh}
											disabled={refreshing}
											aria-label="Segarkan data"
											className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white shadow transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400"
										>
											{refreshing ? (
												<RefreshIcon className="h-5 w-5 animate-[spin_0.8s_linear_infinite_reverse]" />
											) : (
												<RefreshIcon className="h-5 w-5" />
											)}
									</button>
								</div>
							</div>

						{loading ? (
							<Loading />
						) : (
							<IzinTable
									data={filteredData}
									onApproveClick={openApproveConfirm}
									onDeleteClick={openDeleteConfirm}
									canManage={tokenValid}
									busyId={busyId}
								/>
							)}
						</div>

							</div>

						<div className="space-y-6">
							<ClassDistribution data={kelasStats} />
							<div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-lg font-semibold text-gray-800">Aktivitas Terbaru</h3>
										<p className="text-sm text-gray-500">
											Lima izin terbaru yang masuk ke sistem
										</p>
									</div>
								</div>
								<div className="mt-5">
									<RecentActivity data={recentActivity} />
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
			{tokenModalView && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
					<div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
						{tokenModalView === 'activate' && (
							<form
								onSubmit={async (event) => {
									event.preventDefault();
									await handleTokenSubmit();
								}}
								className="space-y-5"
							>
								<h3 className="text-lg font-semibold text-slate-800">
									Masukkan Token Admin
								</h3>
								<p className="text-sm text-slate-500">
									Token diperlukan untuk menyetujui atau menghapus data izin.
								</p>
								<div>
									<label className="sr-only" htmlFor="admin-token-input">
										Token admin
									</label>
									<input
										id="admin-token-input"
										type="password"
										value={tokenInput}
										onChange={(event) => {
											setTokenInput(event.target.value);
											if (tokenError) {
												setTokenError(null);
											}
										}}
										placeholder="Masukkan token admin"
										className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-300"
									/>
									{tokenError && (
										<p className="mt-2 text-xs font-semibold text-rose-500">{tokenError}</p>
									)}
								</div>
								<div className="flex justify-end gap-2">
									<button
										type="button"
										onClick={closeTokenModal}
										className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
									>
										Batal
									</button>
									<button
										type="submit"
										className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-900 shadow transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
									>
										{tokenValid ? 'Simpan Token' : 'Aktifkan Token'}
									</button>
								</div>
							</form>
						)}
						{tokenModalView === 'manage' && (
							<div className="space-y-5">
								<div>
									<h3 className="text-lg font-semibold text-slate-800">Token Aktif</h3>
									<p className="mt-2 text-sm text-slate-500">
										Token admin sedang aktif. Pilih aksi di bawah ini.
									</p>
								</div>
								<div className="flex flex-col gap-2">
									<button
										onClick={beginTokenEdit}
										className="inline-flex items-center justify-center rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-600 transition hover:border-emerald-400 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
									>
										Edit Token
									</button>
									<button
										onClick={handleTokenReset}
										className="inline-flex items-center justify-center rounded-full border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-500 transition hover:border-rose-400 hover:text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200"
									>
										Logout
									</button>
									<button
										onClick={closeTokenModal}
										className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
									>
										Tutup
									</button>
								</div>
							</div>
						)}
						{tokenModalView === 'error' && (
							<div className="space-y-5">
								<h3 className="text-lg font-semibold text-slate-800">Token Ditolak</h3>
								<p className="text-sm text-slate-500">
									{tokenError ?? 'Your token incorrect.'}
								</p>
								<div className="flex justify-end gap-2">
									<button
										onClick={() => {
											closeTokenModal();
										}}
										className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
									>
										Tutup
									</button>
									<button
										onClick={beginTokenEdit}
										className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-900 shadow transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
									>
										Coba Lagi
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
			<ConfirmModal
				open={Boolean(confirmAction)}
				title={confirmAction?.type === 'approve' ? 'Konfirmasi Approve' : 'Konfirmasi Hapus'}
				message={
					confirmAction
						? `Apakah kamu yakin ingin ${
							confirmAction.type === 'approve' ? 'menyetujui' : 'menghapus'
						} izin ${confirmAction.izin.nama}?`
						: ''
				}
				confirmLabel={confirmAction?.type === 'approve' ? 'Ya, Setujui' : 'Ya, Hapus'}
				onConfirm={executeConfirmation}
				onClose={cancelConfirmation}
			/>
		</>
	);
}
