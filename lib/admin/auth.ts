import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

const COOKIE_NAME = "admin_session";
const MAX_AGE_SEC = 60 * 60 * 24;

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify admin session from a Request object (for use in API route handlers).
 * Returns null if authenticated, or a 401 NextResponse if not.
 */
export function requireAdmin(request: Request): NextResponse | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));

  if (!match) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const value = match.slice(COOKIE_NAME.length + 1);
  const dotIndex = value.indexOf(".");
  if (dotIndex < 1) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const timestamp = value.slice(0, dotIndex);
  const signature = value.slice(dotIndex + 1);
  const expected = sign(timestamp, secret);

  const sigBuf = Buffer.from(signature, "utf-8");
  const expBuf = Buffer.from(expected, "utf-8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const age = Date.now() - Number(timestamp);
  if (Number.isNaN(age) || age < 0 || age > MAX_AGE_SEC * 1000) {
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  return null; // authenticated
}
