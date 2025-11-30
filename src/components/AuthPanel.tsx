'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from './ProfileProvider';

const passwordMinLength = 6;

export const AuthPanel = () => {
	const { refreshProfile } = useProfile();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setStatusMessage(null);

		const cleanedEmail = email.trim().toLowerCase();
		if (!cleanedEmail) {
			setStatusMessage('Email wajib diisi.');
			return;
		}
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
			setStatusMessage('Masukkan email yang valid.');
			return;
		}
		setBusy(true);
		try {
			const { error } = await supabase.auth.signInWithPassword({ email: cleanedEmail, password });
			if (error) {
				setStatusMessage(error.message);
				return;
			}
			await refreshProfile();
			setStatusMessage('Berhasil masuk.');
		} finally {
			setBusy(false);
		}
	};

	return (
		<section id="autentikasi" className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900/80 px-6 py-7 shadow-xl backdrop-blur">
			<div className="flex flex-col gap-1">
				<h2 className="text-lg font-semibold text-slate-50">Masuk ke Dashboard</h2>
				<p className="text-sm text-slate-400">
					Akun dibuat oleh administrator Diporani. Gunakan email yang dibagikan oleh pengurus.
				</p>
			</div>
			<form onSubmit={handleSubmit} className="mt-5 space-y-4">
				<label className="block text-sm font-medium text-slate-300">
					<span>Email</span>
					<input
						type="text"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
						required
					/>
				</label>
				<label className="block text-sm font-medium text-slate-300">
					<span>Password</span>
					<input
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						className="mt-1 w-full rounded-2xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
						required
						minLength={passwordMinLength}
					/>
				</label>
				{statusMessage && (
					<p className="rounded-2xl border border-amber-500/40 bg-amber-950/50 px-4 py-2 text-sm text-amber-200">
						{statusMessage}
					</p>
				)}
				<button
					type="submit"
					disabled={busy}
					className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700"
				>
					{busy ? 'Memproses...' : 'Masuk'}
				</button>
			</form>
		</section>
	);
};
