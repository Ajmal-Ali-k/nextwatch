import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/admin/session";

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json(
      { error: "Admin password is not configured" },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const pwBuf = Buffer.from(password, "utf-8");
  const expectedBuf = Buffer.from(adminPassword, "utf-8");

  const valid =
    pwBuf.length === expectedBuf.length && timingSafeEqual(pwBuf, expectedBuf);

  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  await createSessionCookie();
  return NextResponse.json({ ok: true });
}
