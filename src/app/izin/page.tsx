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
	type: 'approve' | 'delete' | 'bulkDelete';
	izin?: Izin;
	izinIds?: string[];
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
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

	// Auto-refresh every 10 seconds
	useEffect(() => {
		const intervalId = setInterval(() => {
			fetchIzin().catch((error: unknown) => console.error('Auto-refresh error:', error));
		}, 10000); // 10 seconds

		return () => clearInterval(intervalId);
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

	const handleBulkDelete = async (ids: string[]) => {
		if (!tokenValid || !actionToken) {
			setTokenError('Aktifkan token admin terlebih dahulu.');
			openTokenModal();
			return;
		}
		try {
			setBusyId('bulk-delete');
			// Delete all selected items
			const deletePromises = ids.map(id =>
				fetch(`/api/izin/${id}`, {
					method: 'DELETE',
					headers: {
						'x-action-token': actionToken,
					},
				})
			);
			
			const results = await Promise.all(deletePromises);
			const failedCount = results.filter(r => !r.ok).length;
			
			if (failedCount > 0) {
				console.error(`${failedCount} items gagal dihapus`);
			}
			
			await fetchIzin();
			setSelectedIds(new Set()); // Clear selection
		} catch (error) {
			console.error(error);
			alert('Gagal menghapus beberapa izin.');
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

	const openBulkDeleteConfirm = () => {
		if (!tokenValid) {
			setTokenError('Aktifkan token admin terlebih dahulu.');
			openTokenModal();
			return;
		}
		if (selectedIds.size === 0) {
			alert('Pilih izin yang ingin dihapus terlebih dahulu.');
			return;
		}
		setConfirmAction({ type: 'bulkDelete', izinIds: Array.from(selectedIds) });
	};

	const cancelConfirmation = () => {
		setConfirmAction(null);
	};

	const executeConfirmation = async () => {
		if (!confirmAction) return;
		if (confirmAction.type === 'approve' && confirmAction.izin) {
			await handleApprove(confirmAction.izin.id);
		} else if (confirmAction.type === 'delete' && confirmAction.izin) {
			await handleDelete(confirmAction.izin.id);
		} else if (confirmAction.type === 'bulkDelete' && confirmAction.izinIds) {
			await handleBulkDelete(confirmAction.izinIds);
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
			<div className="min-h-screen bg-slate-950 pb-16">
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
				<div className="px-4 pt-10 lg:px-6">
					{/* Summary cards */}
					<section className="grid grid-cols-2 gap-3 mb-6 sm:gap-4 lg:grid-cols-4 lg:mb-8">
						<div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 px-3 py-3 shadow-md sm:rounded-2xl sm:px-4 sm:py-4">
							<p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400 sm:text-xs sm:tracking-[0.18em]">Total Izin</p>
							<p className="mt-1 text-xl font-bold text-slate-50 sm:mt-2 sm:text-2xl">{totalCount}</p>
							<p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">Semua data tercatat</p>
						</div>
						<div className="rounded-xl border border-emerald-700/60 bg-gradient-to-br from-emerald-900 to-emerald-800 px-3 py-3 shadow-md sm:rounded-2xl sm:px-4 sm:py-4">
							<p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300 sm:text-xs sm:tracking-[0.18em]">Auto Refresh</p>
							<p className="mt-1 text-xl font-bold text-emerald-50 sm:mt-2 sm:text-2xl">10 dtk</p>
							<p className="mt-0.5 text-[10px] text-emerald-100/80 sm:mt-1 sm:text-xs">Sinkron otomatis</p>
						</div>
						<div className="rounded-xl border border-sky-700/60 bg-gradient-to-br from-sky-900 to-sky-800 px-3 py-3 shadow-md sm:rounded-2xl sm:px-4 sm:py-4">
							<p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-300 sm:text-xs sm:tracking-[0.18em]">Pending</p>
							<p className="mt-1 text-xl font-bold text-sky-50 sm:mt-2 sm:text-2xl">{pendingCount}</p>
							<p className="mt-0.5 text-[10px] text-sky-100/80 sm:mt-1 sm:text-xs">Belum diproses</p>
						</div>
						<div className="rounded-xl border border-amber-700/60 bg-gradient-to-br from-amber-900 to-amber-800 px-3 py-3 shadow-md sm:rounded-2xl sm:px-4 sm:py-4">
							<p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-amber-200 sm:text-xs sm:tracking-[0.18em]">Mode Data</p>
							<p className="mt-1 text-xl font-bold text-amber-50 sm:mt-2 sm:text-2xl">{showArchived ? 'Arsip' : 'Aktif'}</p>
							<p className="mt-0.5 text-[10px] text-amber-100/80 sm:mt-1 sm:text-xs">{showArchived ? 'Arsip mingguan' : 'Izin aktif'}</p>
						</div>
					</section>
					<section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 px-4 py-6 text-slate-50 shadow-2xl ring-1 ring-slate-800 sm:rounded-3xl sm:px-7 sm:py-12">
						<div className="absolute -left-24 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />
						<div className="absolute -right-24 top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />
						<div className="relative z-10 max-w-3xl">
							<span className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-300 ring-1 ring-slate-700 sm:px-4 sm:text-[11px] sm:tracking-[0.28em]">
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
								Realtime Dashboard
							</span>
							<h1 className="mt-4 text-2xl font-bold leading-snug text-slate-50 sm:mt-6 sm:text-4xl lg:text-5xl">
								Dashboard Rekap Izin Diporani
							</h1>
							<p className="mt-2 max-w-2xl text-xs text-slate-300 sm:mt-3 sm:text-sm">
								Pantau semua permohonan izin anggota secara realtime. Data tersinkron otomatis dengan Supabase
								dan siap digunakan sebagai bahan monitoring BPH.
							</p>
							<div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-medium text-slate-200 sm:mt-6 sm:gap-4 sm:text-xs">
								<div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-2.5 py-1 ring-1 ring-slate-700 sm:gap-2 sm:px-3">
									<span className="h-1.5 w-1.5 rounded-full bg-emerald-400 sm:h-2 sm:w-2" />
									<span>Auto refresh 10 dtk</span>
								</div>
								<div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-2.5 py-1 ring-1 ring-slate-700 sm:gap-2 sm:px-3">
									<span className="h-1.5 w-1.5 rounded-full bg-sky-400 sm:h-2 sm:w-2" />
									<span>Supabase</span>
								</div>
								<Link
									href="/arsip"
									className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-900 shadow-sm transition hover:bg-white sm:px-4 sm:py-2 sm:text-[11px]"
								>
									Lihat Arsip
								</Link>
							</div>
						</div>
					</section>

					<section className="mt-6 grid gap-4 sm:mt-10 sm:gap-6 lg:grid-cols-[2fr_1fr] overflow-hidden">
						<div className="space-y-4 sm:space-y-6 min-w-0 overflow-hidden">
							<div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg ring-1 ring-slate-800 sm:gap-4 sm:rounded-3xl sm:p-6">
								<div className="flex flex-col gap-3 sm:gap-4">
									{/* Status Filter */}
									<div className="flex flex-wrap items-center justify-center gap-1.5 rounded-full bg-slate-800 px-2 py-1.5 ring-1 ring-slate-700 sm:gap-2">
										{statusOptions.map((option) => (
											<button
												key={option.key}
												onClick={() => setStatusFilter(option.key)}
												className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition sm:px-3 sm:text-xs ${
													statusFilter === option.key
														? 'bg-sky-500 text-white shadow-sm'
														: 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
												}`}
											>
												{option.label}
											</button>
										))}
									</div>
									
									{/* Data Mode Toggle */}
									<div className="flex flex-wrap justify-center gap-1.5 items-center sm:gap-2">
										<span className="text-[10px] font-semibold text-slate-400 sm:text-xs">Tampilkan:</span>
										<button
											onClick={() => setShowArchived(false)}
											className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition sm:px-3 sm:text-xs ${
												!showArchived
													? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
													: 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
											}`}
										>
											Aktif
										</button>
										<button
											onClick={() => setShowArchived(true)}
											className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition sm:px-3 sm:text-xs ${
												showArchived
													? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm'
													: 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
											}`}
										>
											Arsip
										</button>
									</div>
									
									{/* Kelas Filter */}
									<div className="flex flex-wrap justify-center gap-1.5 overflow-x-auto sm:gap-2">
										<button
											onClick={clearKelasFilter}
											className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition sm:px-3 sm:text-xs ${
												kelasFilter.length === 0
													? 'border-sky-500 bg-sky-500/20 text-sky-300 shadow-sm'
													: 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
													className={`flex-shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition sm:px-3 sm:text-xs ${
														active
															? 'border-sky-500 bg-sky-500/20 text-sky-300 shadow-sm'
															: 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
													}`}
												>
													{kelas}
												</button>
											);
										})}
									</div>
									
									{/* Search & Actions */}
									<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
										<div className="flex gap-2 w-full">
											<div className="relative flex-1">
												<input
													type="search"
													value={search}
													onChange={(event) => setSearch(event.target.value)}
													placeholder="Cari nama/alasan..."
													className="w-full rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-sky-500 sm:px-4 sm:text-sm"
												/>
											</div>
											<button
												onClick={handleRefresh}
												disabled={refreshing}
												aria-label="Segarkan data"
												className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-slate-200 shadow transition hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:h-10 sm:w-10"
											>
												{refreshing ? (
													<RefreshIcon className="h-4 w-4 animate-[spin_0.8s_linear_infinite_reverse] sm:h-5 sm:w-5" />
												) : (
													<RefreshIcon className="h-4 w-4 sm:h-5 sm:w-5" />
												)}
											</button>
										</div>
										{tokenValid && selectedIds.size > 0 && (
											<button
												onClick={openBulkDeleteConfirm}
												disabled={busyId === 'bulk-delete'}
												className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white shadow transition hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:cursor-not-allowed disabled:bg-rose-300 sm:gap-2 sm:px-4 sm:text-sm"
											>
												<svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
												Hapus {selectedIds.size}
											</button>
										)}
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
									selectedIds={selectedIds}
									onSelectionChange={setSelectedIds}
								/>
							)}
						</div>

						</div>

						<div className="space-y-4 sm:space-y-6 min-w-0 overflow-hidden">
							<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg ring-1 ring-slate-800 sm:rounded-3xl sm:p-6 overflow-hidden">
								<h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 sm:text-sm sm:tracking-[0.18em]">
									Distribusi Kelas
								</h3>
								<p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">
									Rekap jumlah izin per kelas.
								</p>
								<div className="mt-3 sm:mt-4">
									<ClassDistribution data={kelasStats} />
								</div>
							</div>
							<div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg ring-1 ring-slate-800 sm:rounded-3xl sm:p-6 overflow-hidden">
								<h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 sm:text-sm sm:tracking-[0.18em]">
									Aktivitas Terbaru
								</h3>
								<p className="mt-0.5 text-[10px] text-slate-500 sm:mt-1 sm:text-xs">
									Lima izin terbaru.
								</p>
								<div className="mt-3 sm:mt-4">
									<RecentActivity data={recentActivity} />
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
			{tokenModalView && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
					<div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-xl">
						{tokenModalView === 'activate' && (
							<form
								onSubmit={async (event) => {
									event.preventDefault();
									await handleTokenSubmit();
								}}
								className="space-y-5"
							>
								<h3 className="text-lg font-semibold text-slate-50">
									Masukkan Token Admin
								</h3>
								<p className="text-sm text-slate-400">
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
										className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500"
									/>
									{tokenError && (
										<p className="mt-2 text-xs font-semibold text-rose-400">{tokenError}</p>
									)}
								</div>
								<div className="flex justify-end gap-2">
									<button
										type="button"
										onClick={closeTokenModal}
										className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
									>
										Batal
									</button>
									<button
										type="submit"
										className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
									>
										{tokenValid ? 'Simpan Token' : 'Aktifkan Token'}
									</button>
								</div>
							</form>
						)}
						{tokenModalView === 'manage' && (
							<div className="space-y-5">
								<div>
									<h3 className="text-lg font-semibold text-slate-50">Token Aktif</h3>
									<p className="mt-2 text-sm text-slate-400">
										Token admin sedang aktif. Pilih aksi di bawah ini.
									</p>
								</div>
								<div className="flex flex-col gap-2">
									<button
										onClick={beginTokenEdit}
										className="inline-flex items-center justify-center rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:border-emerald-500 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
									>
										Edit Token
									</button>
									<button
										onClick={handleTokenReset}
										className="inline-flex items-center justify-center rounded-full border border-rose-600 px-4 py-2 text-sm font-semibold text-rose-400 transition hover:border-rose-500 hover:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
									>
										Logout
									</button>
									<button
										onClick={closeTokenModal}
										className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
									>
										Tutup
									</button>
								</div>
							</div>
						)}
						{tokenModalView === 'error' && (
							<div className="space-y-5">
								<h3 className="text-lg font-semibold text-slate-50">Token Ditolak</h3>
								<p className="text-sm text-slate-400">
									{tokenError ?? 'Your token incorrect.'}
								</p>
								<div className="flex justify-end gap-2">
									<button
										onClick={() => {
											closeTokenModal();
										}}
										className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
									>
										Tutup
									</button>
									<button
										onClick={beginTokenEdit}
										className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
				title={
					confirmAction?.type === 'approve' 
						? 'Konfirmasi Approve' 
						: confirmAction?.type === 'bulkDelete'
						? 'Konfirmasi Hapus Multiple'
						: 'Konfirmasi Hapus'
				}
				message={
					confirmAction
						? confirmAction.type === 'bulkDelete'
							? `Apakah kamu yakin ingin menghapus ${confirmAction.izinIds?.length} izin yang dipilih? Tindakan ini tidak dapat dibatalkan.`
							: `Apakah kamu yakin ingin ${
								confirmAction.type === 'approve' ? 'menyetujui' : 'menghapus'
							} izin ${confirmAction.izin?.nama}?`
						: ''
				}
				confirmLabel={
					confirmAction?.type === 'approve' 
						? 'Ya, Setujui' 
						: confirmAction?.type === 'bulkDelete'
						? `Ya, Hapus ${confirmAction.izinIds?.length} Izin`
						: 'Ya, Hapus'
				}
				onConfirm={executeConfirmation}
				onClose={cancelConfirmation}
			/>
		</>
	);
}
