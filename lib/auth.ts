import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Access control for the demo.
 *
 * The deployed URL is public, so without a gate anyone who finds it can spend
 * the project's Anthropic credits. A shared passphrase is the right weight for
 * a demo: the cookie it issues is HMAC-signed, so it is a real credential
 * rather than a boolean flag a user can set in devtools.
 */

export const SESSION_COOKIE = "ad_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

/** Hash to a fixed width so comparison is timing-safe and length-safe. */
function digest(value: string, key: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return value;
}

/**
 * Constant-time comparison of the submitted code against DEMO_ACCESS_CODE.
 * Both sides are HMAC'd first, so lengths always match and a wrong-length
 * guess leaks nothing.
 */
export function verifyAccessCode(submitted: string): boolean {
  const expected = process.env.DEMO_ACCESS_CODE;
  if (!expected) throw new Error("DEMO_ACCESS_CODE is not set");
  const key = secret();
  return timingSafeEqual(digest(submitted, key), digest(expected, key));
}

/** Issues `<expiresAt>.<signature>`. The signature covers the expiry. */
export function createSessionToken(now = Date.now()): string {
  const expiresAt = String(now + SESSION_TTL_MS);
  const signature = digest(expiresAt, secret()).toString("hex");
  return `${expiresAt}.${signature}`;
}

export function verifySessionToken(
  token: string | undefined,
  now = Date.now(),
): boolean {
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator === -1) return false;

  const expiresAt = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "hex");
  } catch {
    return false;
  }

  const expected = digest(expiresAt, secret());
  if (provided.length !== expected.length) return false;
  if (!timingSafeEqual(provided, expected)) return false;

  // Signature is valid, so the expiry has not been tampered with.
  const expiry = Number(expiresAt);
  return Number.isFinite(expiry) && expiry > now;
}

/**
 * Best-effort per-IP rate limit.
 *
 * This is in-memory, so on Vercel it is per-instance and resets on cold start.
 * It is a speed bump against a loop hitting the endpoint, not a real quota --
 * the access code is the actual control. Called out in the README.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(ip: string, now = Date.now()): boolean {
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  entry.count += 1;
  return entry.count <= MAX_REQUESTS_PER_WINDOW;
}

/** Vercel forwards the caller's address in x-forwarded-for. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

/** Reads and verifies the session cookie. Use at the top of every LLM route. */
export async function hasValidSession(): Promise<boolean> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
