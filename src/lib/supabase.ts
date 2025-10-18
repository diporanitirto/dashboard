import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Check environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Izin = {
  id: string;
  nama: string;
  absen: number;
  kelas: 'X1' | 'X2' | 'X3' | 'X4' | 'X5' | 'X6' | 'X7' | 'X8';
  alasan: string;
  status: 'pending' | 'approved';
  created_at: string;
};

export type ArchivedIzin = Izin & {
  archive_date: string;
  archived_at: string;
};
