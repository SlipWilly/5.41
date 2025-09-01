import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, method: "GET" });
}

export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  return NextResponse.json({ ok: true, method: "POST", echo: body });
}
