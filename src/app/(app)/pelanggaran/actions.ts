"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";
import { SESSION_COOKIE, isValidToken, userFromToken } from "@/lib/auth";
import { perluBuktiUntukPoin, tahapUntukPoin, type TahapHukuman } from "@/lib/pelanggaran";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: number;
}

/** Pastikan hanya petugas yang login bisa memanggil server action ini. */
async function petugasLogin(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!isValidToken(token)) return null;
  return userFromToken(token) ?? "?";
}

/**
 * Sesuaikan catatan yang belum diproses (bukti_status 'belum') dengan tabel tahap
 * terbaru. Dipanggil setiap kali pengaturan tahap hukuman berubah, supaya siswa
 * langsung bisa upload bukti untuk hukuman yang sedang berlaku, misalnya saat
 * hukuman tahap baru ditambahkan setelah catatan lama sudah tercatat.
 * Catatan yang sudah diproses (menunggu/selesai/ditolak) tidak diubah.
 */
async function syncHukumanBelum(): Promise<void> {
  const supabase = getSupabase();
  const [{ data: tahapList }, { data: records }] = await Promise.all([
    supabase.from("tahap_hukuman").select("id, min_poin, hukuman").order("min_poin", { ascending: true }),
    supabase
      .from("pelanggaran")
      .select("id, total_poin, hukuman, perlu_bukti, asal_pelanggaran_id")
      .eq("bukti_status", "belum")
      .not("total_poin", "is", null)
      .is("asal_pelanggaran_id", null),
  ]);

  const tahap = (tahapList ?? []) as TahapHukuman[];
  for (const r of records ?? []) {
    const hukuman = tahapUntukPoin(r.total_poin, tahap)?.hukuman ?? null;
    const perluBukti = perluBuktiUntukPoin(r.total_poin, tahap);
    if (r.hukuman === hukuman && r.perlu_bukti === perluBukti) continue;

    const { error } = await supabase
      .from("pelanggaran")
      .update({ hukuman, perlu_bukti: perluBukti })
      .eq("id", r.id);
    if (error) console.error("syncHukumanBelum error:", error);
  }
}

export async function catatPelanggaran(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const siswaId = Number(formData.get("siswa_id"));
  const jenisIdsRaw = String(formData.get("jenis_ids") ?? "").trim();
  const jenisIds = jenisIdsRaw
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  const tanggal = String(formData.get("tanggal") ?? "").trim();
  const keterangan = String(formData.get("keterangan") ?? "").trim();

  if (!siswaId || jenisIds.length === 0) return { ok: false, error: "Siswa dan jenis pelanggaran wajib dipilih." };

  // 1 catatan pelanggaran = 1 poin, berapapun jenis yang dipilih.
  const poin = 1;

  const supabase = getSupabase();
  const [{ data: siswa }, { data: jenisList }, { data: poinSebelumnya }, { data: tahapList }] = await Promise.all([
    supabase.from("siswa").select("id, nis, nama, kelas(nama)").eq("id", siswaId).maybeSingle(),
    supabase.from("jenis_pelanggaran").select("id, nama").in("id", jenisIds),
    supabase.from("pelanggaran").select("poin").eq("siswa_id", siswaId),
    supabase.from("tahap_hukuman").select("id, min_poin, hukuman").order("min_poin", { ascending: true }),
  ]);

  if (!siswa) return { ok: false, error: "Siswa tidak ditemukan." };
  if (!jenisList || jenisList.length === 0) return { ok: false, error: "Jenis pelanggaran tidak ditemukan." };

  // Gabungkan nama jenis yang dipilih, urut sesuai input.
  const namaById = new Map(jenisList.map((j) => [j.id, j.nama]));
  const namaTerpilih = jenisIds.map((id) => namaById.get(id)).filter(Boolean) as string[];
  const jenisNama = namaTerpilih.join(", ");

  const totalPoin = (poinSebelumnya ?? []).reduce((sum, r) => sum + (r.poin ?? 0), 0) + poin;
  const tahapList2 = (tahapList ?? []) as TahapHukuman[];
  let hukuman: string | null = null;
  for (const t of [...tahapList2].sort((a, b) => a.min_poin - b.min_poin)) {
    if (totalPoin >= t.min_poin) hukuman = t.hukuman;
  }
  // Tahap peringatan (tahap pertama) tidak perlu bukti; tahap kedua dst perlu.
  const perluBukti = perluBuktiUntukPoin(totalPoin, tahapList2);

  const kelasNama = (siswa.kelas as unknown as { nama: string } | null)?.nama ?? null;

  const payload: Record<string, unknown> = {
    siswa_id: siswa.id,
    nis: siswa.nis,
    nama: siswa.nama,
    kelas: kelasNama,
    jenis_id: jenisIds[0],
    jenis_nama: jenisNama,
    poin,
    total_poin: totalPoin,
    hukuman,
    perlu_bukti: perluBukti,
    keterangan: keterangan || null,
    dicatat_oleh: petugas,
    generasi: 1,
  };
  if (tanggal) payload.tanggal = tanggal;
  if (perluBukti) {
    const base = tanggal ? new Date(tanggal + 'T00:00:00') : new Date();
    const day = base.getDay(); // 0=Min, 4=Kam
    let diff = (4 - day + 7) % 7;
    if (diff === 0) diff = 7; // kalau hari Kamis, deadline Kamis depan
    const dl = new Date(base);
    dl.setDate(dl.getDate() + diff);
    payload.deadline_hari = diff;
    payload.deadline = dl.toISOString().slice(0, 10);
  }

  const { error } = await supabase.from("pelanggaran").insert(payload);
  if (error) {
    console.error("catatPelanggaran error:", error);
    return { ok: false, error: "Gagal menyimpan pelanggaran." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function verifikasiBukti(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!id || (status !== "selesai" && status !== "ditolak")) {
    return { ok: false, error: "Data tidak valid." };
  }
  if (status === "ditolak" && !note) {
    return { ok: false, error: "Alasan penolakan wajib diisi." };
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from("pelanggaran")
    .update({
      bukti_status: status,
      bukti_note: status === "ditolak" ? note : null,
      verified_by: petugas,
      verified_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("verifikasiBukti error:", error);
    return { ok: false, error: "Gagal memperbarui status bukti." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function hapusPelanggaran(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = getSupabase();
  const { error } = await supabase.from("pelanggaran").delete().eq("id", id);
  if (error) {
    console.error("hapusPelanggaran error:", error);
    return { ok: false, error: "Gagal menghapus catatan." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

/** Format tanggal lokal YYYY-MM-DD (bukan toISOString, biar tidak bergeser zona waktu). */
function formatTanggalLokal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse 'YYYY-MM-DD' sebagai tanggal lokal, bukan UTC. */
function parseTanggalLokal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function diffHari(dari: Date, ke: Date): number {
  const a = Date.UTC(dari.getFullYear(), dari.getMonth(), dari.getDate());
  const b = Date.UTC(ke.getFullYear(), ke.getMonth(), ke.getDate());
  return Math.round((b - a) / 86400000);
}

/**
 * Perpanjang deadline tugas pelanggaran (admin/pendamping). Ini pengecualian
 * di luar ritme Kamis: tugas yang ikut perpanjangan menyesuaikan penambahannya,
 * sedangkan tugas yang dibuat setelahnya tetap mengikuti interval Kamis depan.
 * Berlaku untuk seluruh keluarga tugas (naik ke root lewat asal_pelanggaran_id,
 * lalu turun mengumpulkan sumber, Penugasan Sangga, dan Eskalasi gen 3).
 * Semua tugas yang perlu bukti ikut maju, termasuk yang sudah selesai.
 * Keluarga diseragamkan ke tanggal terjauh (max tanggal dipilih, seluruh deadline
 * keluarga), jadi tidak ada anggota yang mundur.
 * Yang berubah hanya deadline (+deadline_hari); alasan wajib dan dicatat di deadline_log.
 */
export async function perpanjangDeadline(formData: FormData): Promise<ActionResult & { jumlah?: number }> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = String(formData.get("id") ?? "");
  const hari = Number(formData.get("hari") ?? 0);
  const tanggalManual = String(formData.get("tanggal") ?? "").trim();
  const alasan = String(formData.get("alasan") ?? "").trim();

  if (!id) return { ok: false, error: "Data tidak valid." };
  if (alasan.length < 5) return { ok: false, error: "Alasan minimal 5 karakter." };

  const supabase = getSupabase();

  // Periksa tabel log lebih dulu supaya deadline tidak berubah tanpa jejak.
  const { error: logCheckErr } = await supabase.from("deadline_log").select("id").limit(1);
  if (logCheckErr) {
    return { ok: false, error: "Tabel deadline_log belum ada. Jalankan sql/15-perpanjangan-deadline.sql di Supabase." };
  }

  const { data: row, error: rowErr } = await supabase
    .from("pelanggaran")
    .select("id, tanggal, deadline, perlu_bukti")
    .eq("id", id)
    .maybeSingle();
  if (rowErr || !row) return { ok: false, error: "Catatan tidak ditemukan." };
  if (!row.perlu_bukti) return { ok: false, error: "Tugas ini tidak perlu bukti, tidak ada deadline." };

  const hariIni = new Date();
  const deadlineLama = row.deadline ? parseTanggalLokal(row.deadline) : null;
  let target: Date;
  if (hari > 0) {
    const base = deadlineLama ?? hariIni;
    target = new Date(base);
    target.setDate(base.getDate() + hari);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(tanggalManual)) {
    target = parseTanggalLokal(tanggalManual);
  } else {
    return { ok: false, error: "Pilih perpanjangan cepat atau tanggal manual." };
  }

  if (deadlineLama && target <= deadlineLama) {
    return { ok: false, error: "Tanggal baru harus setelah deadline sekarang." };
  }
  if (!deadlineLama && diffHari(hariIni, target) < 0) {
    return { ok: false, error: "Tanggal baru tidak boleh di masa lalu." };
  }

  let rootId = id;
  for (let i = 0; i < 10; i++) {
    const { data: cur } = await supabase
      .from("pelanggaran")
      .select("id, asal_pelanggaran_id")
      .eq("id", rootId)
      .maybeSingle();
    if (!cur?.asal_pelanggaran_id) break;
    rootId = cur.asal_pelanggaran_id;
  }
  const semua = new Set<string>([rootId]);
  let frontier = [rootId];
  for (let i = 0; i < 10 && frontier.length > 0; i++) {
    const { data: anak } = await supabase
      .from("pelanggaran")
      .select("id")
      .in("asal_pelanggaran_id", frontier);
    const next = (anak ?? []).map((a) => a.id).filter((aid) => !semua.has(aid));
    for (const aid of next) semua.add(aid);
    frontier = next;
  }
  const ids = [...semua];

  const { data: targets, error: targetErr } = await supabase
    .from("pelanggaran")
    .select("id, tanggal, deadline, perlu_bukti")
    .in("id", ids);
  if (targetErr) {
    console.error("perpanjangDeadline load error:", targetErr);
    return { ok: false, error: "Gagal memuat tugas terdampak." };
  }
  const layak = (targets ?? []).filter((t) => t.perlu_bukti);
  if (layak.length === 0) return { ok: false, error: "Tidak ada tugas yang perlu bukti di keluarga ini." };

  // Seragamkan ke tanggal terjauh keluarga: tidak ada anggota yang mundur.
  const targetIso = formatTanggalLokal(target);
  let finalIso = targetIso;
  for (const t of layak) {
    if (t.deadline && t.deadline > finalIso) finalIso = t.deadline;
  }
  const finalDate = parseTanggalLokal(finalIso);

  for (const t of layak) {
    const { error: uErr } = await supabase
      .from("pelanggaran")
      .update({ deadline: finalIso, deadline_hari: diffHari(parseTanggalLokal(t.tanggal), finalDate) })
      .eq("id", t.id);
    if (uErr) {
      console.error("perpanjangDeadline update error:", t.id, uErr);
      return { ok: false, error: "Gagal memperbarui deadline. Cek catatan yang berubah sebelum mencoba lagi." };
    }
  }
  const logs = layak.map((t) => ({
    pelanggaran_id: t.id,
    deadline_lama: t.deadline,
    deadline_baru: finalIso,
    lingkup: "sangga",
    alasan,
    oleh: petugas,
  }));
  const { error: logErr } = await supabase.from("deadline_log").insert(logs);
  if (logErr) {
    console.error("perpanjangDeadline log error:", logErr);
    revalidatePath("/pelanggaran");
    return { ok: false, error: "Deadline sudah berubah, tetapi log gagal tersimpan. Cek Supabase." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true, jumlah: layak.length };
}

export async function tambahJenis(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const nama = String(formData.get("nama") ?? "").trim();
  if (!nama) return { ok: false, error: "Nama jenis wajib diisi." };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("jenis_pelanggaran")
    .insert({ nama, poin: 1 })
    .select("id")
    .single();
  if (error || !data) {
    if (error?.code === "23505") return { ok: false, error: "Jenis dengan nama itu sudah ada." };
    console.error("tambahJenis error:", error);
    return { ok: false, error: "Gagal menambah jenis." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true, id: data.id };
}

export async function ubahJenis(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = Number(formData.get("id"));
  const nama = String(formData.get("nama") ?? "").trim();
  const aktif = String(formData.get("aktif")) === "true";

  if (!id || !nama) return { ok: false, error: "Data tidak valid." };

  const supabase = getSupabase();
  const { error } = await supabase.from("jenis_pelanggaran").update({ nama, poin: 1, aktif }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Jenis dengan nama itu sudah ada." };
    console.error("ubahJenis error:", error);
    return { ok: false, error: "Gagal menyimpan jenis." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function hapusJenis(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = Number(formData.get("id"));
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = getSupabase();
  const { error } = await supabase.from("jenis_pelanggaran").delete().eq("id", id);
  if (error) {
    console.error("hapusJenis error:", error);
    return { ok: false, error: "Gagal menghapus jenis." };
  }

  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function tambahTahap(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const minPoin = Math.round(Number(formData.get("min_poin")));
  const hukuman = String(formData.get("hukuman") ?? "").trim();
  if (!Number.isFinite(minPoin) || minPoin <= 0) return { ok: false, error: "Minimal poin harus angka positif." };
  if (!hukuman) return { ok: false, error: "Hukuman wajib diisi." };

  const supabase = getSupabase();
  const { error } = await supabase.from("tahap_hukuman").insert({ min_poin: minPoin, hukuman });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Tahap dengan minimal poin itu sudah ada." };
    console.error("tambahTahap error:", error);
    return { ok: false, error: "Gagal menambah tahap." };
  }

  await syncHukumanBelum();
  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function ubahTahap(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = Number(formData.get("id"));
  const minPoin = Math.round(Number(formData.get("min_poin")));
  const hukuman = String(formData.get("hukuman") ?? "").trim();
  if (!id) return { ok: false, error: "Data tidak valid." };
  if (!Number.isFinite(minPoin) || minPoin <= 0) return { ok: false, error: "Minimal poin harus angka positif." };
  if (!hukuman) return { ok: false, error: "Hukuman wajib diisi." };

  const supabase = getSupabase();
  const { error } = await supabase
    .from("tahap_hukuman")
    .update({ min_poin: minPoin, hukuman, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Tahap dengan minimal poin itu sudah ada." };
    console.error("ubahTahap error:", error);
    return { ok: false, error: "Gagal menyimpan tahap." };
  }

  await syncHukumanBelum();
  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function hapusTahap(formData: FormData): Promise<ActionResult> {
  const petugas = await petugasLogin();
  if (!petugas) return { ok: false, error: "Sesi habis. Login ulang dulu." };

  const id = Number(formData.get("id"));
  if (!id) return { ok: false, error: "Data tidak valid." };

  const supabase = getSupabase();
  const { error } = await supabase.from("tahap_hukuman").delete().eq("id", id);
  if (error) {
    console.error("hapusTahap error:", error);
    return { ok: false, error: "Gagal menghapus tahap." };
  }

  await syncHukumanBelum();
  revalidatePath("/pelanggaran");
  return { ok: true };
}

export async function prosesDeadlineSanggaInternal(): Promise<ActionResult & { jumlah?: number }> {
  const supabase = getSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: expired, error: eErr } = await supabase
    .from("pelanggaran")
    .select("id, siswa_id, nis, nama, kelas, jenis_nama, poin, hukuman, perlu_bukti, keterangan, deadline, deadline_hari, bukti_status, generasi, siswa(sangga_id)")
    .eq("perlu_bukti", true)
    .lt("generasi", 3)
    .or(`deadline.lte.${today},deadline.is.null`)
    .neq("bukti_status", "selesai")
    .is("sangga_propagated_at", null);

  if (eErr) {
    console.error("prosesDeadlineSangga load error:", eErr);
    return { ok: false, error: "Gagal memuat data deadline." };
  }

  let jumlah = 0;
  for (const r of expired ?? []) {
    const sanggaId = (r.siswa as unknown as { sangga_id: number | null } | null)?.sangga_id;
    if (!sanggaId) {
      await supabase.from("pelanggaran").update({ sangga_propagated_at: new Date().toISOString() }).eq("id", r.id);
      continue;
    }

    const { data: members } = await supabase
      .from("siswa")
      .select("id, nis, nama, kelas(nama)")
      .eq("sangga_id", sanggaId)
      .neq("id", r.siswa_id);

    for (const m of members ?? []) {
      const { data: dup } = await supabase
        .from("pelanggaran")
        .select("id")
        .eq("asal_pelanggaran_id", r.id)
        .eq("siswa_id", m.id)
        .maybeSingle();
      if (dup) continue;

      // Guard anti-double: skip anggota yang sudah punya tugas aktif (belum/menunggu/ditolak)
      // yang overdue, supaya tidak double tugas.
      // Guard: skip anggota yang sudah punya tugas aktif (belum/menunggu/ditolak) yang overdue,
      // termasuk tugas asli (sumber) — supaya sumber tidak kena Penugasan Sangga,
      // dan tidak double tugas. (Sumber otomatis sudah punya tugas sendiri.)
      const { data: existingTask } = await supabase
        .from("pelanggaran")
        .select("id")
        .eq("siswa_id", m.id)
        .eq("perlu_bukti", true)
        .in("bukti_status", ["belum", "menunggu", "ditolak"])
        .or(`deadline.lte.${today},deadline.is.null`)
        .limit(1)
        .maybeSingle();
      if (existingTask) continue;

      const { data: prev } = await supabase.from("pelanggaran").select("poin").eq("siswa_id", m.id);
      const totalPoin = (prev ?? []).reduce((s, x) => s + (x.poin ?? 0), 0) + (r.poin ?? 1);
      const kelasNama = (m.kelas as unknown as { nama: string } | null)?.nama ?? r.kelas;

      const base = new Date();
      const day = base.getDay();
      let diff = (4 - day + 7) % 7;
      if (diff === 0) diff = 7;
      const dl = new Date(base);
      dl.setDate(dl.getDate() + diff);
      const newGenerasi = (r.generasi ?? 1) + 1;
      const isEskalasi = newGenerasi >= 3;
      const label = isEskalasi ? "Eskalasi Sangga" : "Penugasan Sangga";
      const payload: Record<string, unknown> = {
        siswa_id: m.id,
        nis: m.nis,
        nama: m.nama,
        kelas: kelasNama,
        jenis_nama: label,
        poin: r.poin ?? 1,
        total_poin: totalPoin,
        hukuman: `${label}: ${r.hukuman ?? r.jenis_nama ?? "tugas sangga"}`,
        perlu_bukti: true,
        keterangan: `Tugas khusus sangga (level ${newGenerasi}). Asal: ${r.nama} tidak menyelesaikan tugas tepat waktu.`,
        dicatat_oleh: "sistem",
        deadline_hari: diff,
        deadline: dl.toISOString().slice(0, 10),
        asal_pelanggaran_id: r.id,
        generasi: newGenerasi,
      };

      const { error: iErr } = await supabase.from("pelanggaran").insert(payload);
      if (iErr) {
        console.error("propagasi insert error:", iErr);
        continue;
      }
      jumlah++;
    }

    await supabase
      .from("pelanggaran")
      .update({ sangga_propagated_at: new Date().toISOString() })
      .eq("id", r.id);
  }

  revalidatePath("/pelanggaran");
  return { ok: true, jumlah };
}
