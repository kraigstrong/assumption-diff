import { NextResponse } from "next/server";
import {
  clientIp,
  createSessionToken,
  rateLimit,
  SESSION_COOKIE,
  verifyAccessCode,
} from "@/lib/auth";

export async function POST(request: Request) {
  if (!rateLimit(clientIp(request))) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }

  if (!process.env.DEMO_ACCESS_CODE || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: "Server is missing DEMO_ACCESS_CODE or SESSION_SECRET." },
      { status: 500 },
    );
  }

  let code = "";
  try {
    const body = await request.json();
    code = typeof body?.code === "string" ? body.code : "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!verifyAccessCode(code)) {
    return NextResponse.json({ error: "That code isn't right." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
