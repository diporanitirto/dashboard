import { NextRequest, NextResponse } from 'next/server';
import { resolveAuthContext } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

const parseDateTime = (date: string | null, time: string | null) => {
  if (!date) return null;
  const timeValue = time && time.length > 0 ? time : '00:00';
  const iso = `${date}T${timeValue}`;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

export const GET = async (request: NextRequest) => {
  const auth = await resolveAuthContext(request);
  if ('response' in auth) {
    return auth.response;
  }

  const { data, error } = await supabaseAdmin
    .from('agendas')
    .select(
      'id, title, description, location, starts_at, ends_at, created_at, profiles(full_name, role)'
    )
    .order('starts_at', { ascending: true });

  if (error) {
    console.error('Fetch agenda error:', error);
    return NextResponse.json({ error: 'Gagal memuat agenda.' }, { status: 500 });
  }

  type AgendaWithProfile = {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string | null;
    created_at: string;
    profiles: { full_name: string | null; role: string | null } | null;
  };

  const mapped = (data as unknown as AgendaWithProfile[]).map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    location: item.location,
    startsAt: item.starts_at,
    endsAt: item.ends_at,
    createdAt: item.created_at,
    author: item.profiles
      ? {
          name: item.profiles.full_name,
          role: item.profiles.role,
        }
      : null,
  }));

  return NextResponse.json(mapped, { status: 200 });
};

export const POST = async (request: NextRequest) => {
  const auth = await resolveAuthContext(request);
  if ('response' in auth) {
    return auth.response;
  }

  if (auth.profile?.role !== 'bph') {
    return NextResponse.json({ error: 'Hanya BPH yang dapat membuat agenda.' }, { status: 403 });
  }

  const payload = (await request.json().catch(() => null)) as
    | {
        title?: unknown;
        description?: unknown;
        location?: unknown;
        startDate?: unknown;
        startTime?: unknown;
        endDate?: unknown;
        endTime?: unknown;
      }
    | null;

  if (!payload) {
    return NextResponse.json({ error: 'Data tidak valid.' }, { status: 400 });
  }

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const description = typeof payload.description === 'string' ? payload.description.trim() : null;
  const location = typeof payload.location === 'string' ? payload.location.trim() : null;
  const startDate = typeof payload.startDate === 'string' ? payload.startDate : null;
  const startTime = typeof payload.startTime === 'string' ? payload.startTime : null;
  const endDate = typeof payload.endDate === 'string' ? payload.endDate : null;
  const endTime = typeof payload.endTime === 'string' ? payload.endTime : null;

  if (!title) {
    return NextResponse.json({ error: 'Judul agenda wajib diisi.' }, { status: 400 });
  }

  const startsAt = parseDateTime(startDate, startTime);
  if (!startsAt) {
    return NextResponse.json({ error: 'Tanggal mulai tidak valid.' }, { status: 400 });
  }

  const endsAt = endDate ? parseDateTime(endDate, endTime) : null;

  const { data, error } = await supabaseAdmin
    .from('agendas')
    .insert({
      title,
      description,
      location,
      starts_at: startsAt,
      ends_at: endsAt,
      created_by: auth.userId,
    })
    .select('id, title, description, location, starts_at, ends_at, created_at')
    .single();

  if (error || !data) {
    console.error('Insert agenda error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan agenda.' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
};
