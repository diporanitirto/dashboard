import { NextResponse } from "next/server";
import { prosesDeadlineSanggaInternal } from "@/app/(app)/pelanggaran/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const res = await prosesDeadlineSanggaInternal();
  if (!res.ok) return NextResponse.json(res, { status: 500 });
  return NextResponse.json(res);
}