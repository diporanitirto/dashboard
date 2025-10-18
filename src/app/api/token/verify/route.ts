import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const configuredToken = process.env.ADMIN_ACTION_TOKEN;
    if (!configuredToken) {
      console.error('ADMIN_ACTION_TOKEN belum dikonfigurasi.');
      return NextResponse.json(
        { error: 'Konfigurasi server belum lengkap. Hubungi administrator.' },
        { status: 500 }
      );
    }

    let payload: { token?: string } | null = null;
    try {
      payload = await request.json();
    } catch {
      payload = null;
    }

    const token = payload?.token?.trim();
    if (!token) {
      return NextResponse.json({ error: 'Token diperlukan.' }, { status: 400 });
    }

    if (token !== configuredToken) {
      return NextResponse.json({ error: 'Your token incorrect.' }, { status: 401 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('POST /api/token/verify error:', error);
    return NextResponse.json({ error: 'Gagal memverifikasi token.' }, { status: 500 });
  }
}
