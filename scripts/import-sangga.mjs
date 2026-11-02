// Import sangga.json -> tabel sangga + siswa.sangga_id
// Jalankan: node scripts/import-sangga.mjs
// Membutuhkan env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (bisa dari dashboard/.env.local)

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load env dari dashboard/.env.local kalau belum ada
function loadEnv() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const raw = readFileSync(resolve(process.cwd(), '..', '.env.local'), 'utf8');
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {}
}
loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Env Supabase tidak ditemukan. Set NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

// Mapping manual: nama di sangga.json -> id siswa di DB (untuk 24 nama singkatan/typo)
const MANUAL = {
  'Nadha Nadhirotun Naim': 28,
  'Arkha Rega Sanjaya': 5,
  'Imanuel Ilford Purnomo Putra': 17,
  'Johannes Don Bosco Arjuna Agung Setyawan': 18,
  'Annida Nuraini Jannati': 78,
  'Afra Khansa Azzahra Mawardi': 73,
  'Kevin Zaninda Muharram': 89,
  'Alya Aghsell Aziza': 111,
  'Muhammad Irham Nur Rafa': 128,
  'Daffa Aqilla Ardhitya': 158,
  'Nadia Delphina Rusida Assabihah': 199,
  'Adyrezqy Pasha Higuain Widiyatmoko': 181,
  "Alissa Fattonassyifa C.": 220,
  'Milan Rasendriya F.U.': 239,
  'Raditya Bima O.D.S.': 245,
  'Rafa Agusti A.A.': 246,
  "Alba Ka'amil A.": 218,
  'Bagaskara Fahriezal P.': 226,
  'Fairuz Rafi Z.': 229,
  'Muhammad Ravi': 240,
  'Muhammad Diel': 241,
  'Vicendo Syahreza P.': 250,
  'Naura Athaya Darmayanti': 274,
  'Zaneta Ghina Rahadian': 286,
};

const data = JSON.parse(readFileSync('/home/jul/Downloads/sangga.json', 'utf8').toString());

// Ambil semua kelas
const { data: kelasList, error: kErr } = await supabase.from('kelas').select('id, nama');
if (kErr) { console.error(kErr); process.exit(1); }
const kelasMap = new Map(kelasList.map((k) => [k.nama, k.id]));

// Ambil semua siswa (id, nama, kelas_id)
const { data: siswaList, error: sErr } = await supabase.from('siswa').select('id, nama, kelas_id');
if (sErr) { console.error(sErr); process.exit(1); }
// index: kelas_id -> Map nama_upper -> id
const byKelasNama = new Map();
for (const s of siswaList) {
  if (!byKelasNama.has(s.kelas_id)) byKelasNama.set(s.kelas_id, new Map());
  byKelasNama.get(s.kelas_id).set(s.nama.trim().toUpperCase().replace(/’/g, "'"), s.id);
}

let matched = 0, unmatched = 0, sanggaCreated = 0;
const unmatchedList = [];

for (const k of data.kelas) {
  const kelasId = kelasMap.get(k.nama);
  if (!kelasId) { console.warn('Kelas tidak ditemukan:', k.nama); continue; }
  const nameMap = byKelasNama.get(kelasId) ?? new Map();

  for (const [sanggaNama, members] of Object.entries(k.sangga)) {
    // upsert sangga
    const { data: sanggaRow, error: sgErr } = await supabase
      .from('sangga')
      .upsert({ kelas_id: kelasId, nama: sanggaNama }, { onConflict: 'kelas_id,nama' })
      .select('id')
      .single();
    if (sgErr) { console.error('sangga upsert error', sgErr); continue; }
    sanggaCreated++;
    const sanggaId = sanggaRow.id;

    for (const member of members) {
      const norm = member.trim().replace(/’/g, "'");
      const key = norm.toUpperCase();
      let siswaId = nameMap.get(key);
      if (!siswaId) {
        // try original key too
        siswaId = nameMap.get(member.trim().toUpperCase());
      }
      if (!siswaId && MANUAL[norm]) {
        siswaId = MANUAL[norm];
      }
      if (!siswaId) {
        unmatched++;
        unmatchedList.push({ kelas: k.nama, sangga: sanggaNama, nama: member });
        continue;
      }
      const { error: uErr } = await supabase
        .from('siswa')
        .update({ sangga_id: sanggaId })
        .eq('id', siswaId);
      if (uErr) { console.error('update siswa error', uErr, member); continue; }
      matched++;
    }
  }
}

console.log('\\n=== HASIL IMPORT ===');
console.log('Sangga dibuat/diupsert:', sanggaCreated);
console.log('Anggota matched:', matched);
console.log('Anggota unmatched:', unmatched);
if (unmatchedList.length) {
  console.log('\\nUnmatched:');
  for (const u of unmatchedList) console.log(' -', u.kelas, '|', u.sangga, '|', u.nama);
}
