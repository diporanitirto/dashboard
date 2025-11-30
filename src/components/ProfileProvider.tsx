'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { DashboardProfile } from '@/lib/auth';

type ProfileContextValue = {
	profile: DashboardProfile | null;
	session: Session | null;
	loading: boolean;
	refreshProfile: () => Promise<void>;
	signOut: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const buildProfileFromRow = (
	row: Record<string, unknown>,
	email: string
): DashboardProfile | null => {
	const id = typeof row.id === 'string' ? row.id : null;
	if (!id) return null;
	const role = row.role as DashboardProfile['role'] | undefined;
	if (!role) return null;
	
	const tingkatan = (row.tingkatan as DashboardProfile['tingkatan']) ?? null;
	const jabatan = (row.jabatan as DashboardProfile['jabatan']) ?? null;
	
	return {
		id,
		email,
		full_name: (row.full_name as string) ?? null,
		role,
		tingkatan,
		jabatan,
		bio: (row.bio as string) ?? null,
		avatar_url: (row.avatar_url as string) ?? null,
		created_at: (row.created_at as string) ?? new Date().toISOString(),
		updated_at: (row.updated_at as string) ?? new Date().toISOString(),
	};
};

export const ProfileProvider = ({ children }: { children: React.ReactNode }) => {
	const [session, setSession] = useState<Session | null>(null);
	const [profile, setProfile] = useState<DashboardProfile | null>(null);
	const [loading, setLoading] = useState(true);

	const fetchProfile = useCallback(async (activeSession: Session | null) => {
		if (!activeSession?.user) {
			setProfile(null);
			setLoading(false);
			return;
		}

		const { user } = activeSession;
		const email = user.email ?? 'unknown@unknown';

		const { data, error } = await supabase
			.from('profiles')
			.select('id, full_name, role, tingkatan, jabatan, bio, avatar_url, created_at, updated_at')
			.eq('id', user.id)
			.maybeSingle();

		if (error && error.code !== 'PGRST116') {
			console.error('fetchProfile error:', error);
			setProfile(null);
			setLoading(false);
			return;
		}

		if (!data) {
			setProfile(null);
			setLoading(false);
			return;
		}

		const mapped = buildProfileFromRow(data, email);
		setProfile(mapped);
		setLoading(false);
	}, []);

	useEffect(() => {
		let isMounted = true;
		supabase.auth
			.getSession()
			.then(({ data, error }) => {
				if (!isMounted) return;
				if (error) {
					console.error('getSession error:', error);
					setSession(null);
					setProfile(null);
					setLoading(false);
					return;
				}
				setSession(data.session);
				fetchProfile(data.session).catch((fetchError) => {
					console.error(fetchError);
				});
			})
			.catch((error) => {
				console.error('Initial session load failed:', error);
				if (!isMounted) return;
				setSession(null);
				setProfile(null);
				setLoading(false);
			});

		const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
			setSession(nextSession);
			fetchProfile(nextSession).catch((error) => {
				console.error('Profile refresh after auth change failed:', error);
			});
		});

		return () => {
			isMounted = false;
			listener.subscription.unsubscribe();
		};
	}, [fetchProfile]);

	const refreshProfile = useCallback(async () => {
		await fetchProfile(session);
	}, [fetchProfile, session]);

	const signOut = useCallback(async () => {
		await supabase.auth.signOut();
	}, []);

	const value = useMemo<ProfileContextValue>(
		() => ({ profile, session, loading, refreshProfile, signOut }),
		[loading, profile, refreshProfile, session, signOut]
	);

	return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};

export const useProfile = () => {
	const context = useContext(ProfileContext);
	if (!context) {
		throw new Error('useProfile must be used within ProfileProvider');
	}
	return context;
};
