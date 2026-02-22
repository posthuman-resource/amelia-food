import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { getDb } from "@/db/client";
import { rateLimits } from "@/db/schema";
import { eq } from "drizzle-orm";

const COOKIE_NAME = "amelia-auth";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getPassword(): string {
  const pw = process.env.SITE_PASSWORD;
  if (!pw) throw new Error("SITE_PASSWORD env var is missing");
  return pw;
}

export function createToken(): string {
  const timestamp = Date.now().toString();
  const hmac = createHmac("sha256", getPassword())
    .update(timestamp)
    .digest("hex");
  return `${timestamp}.${hmac}`;
}

export function verifyToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [timestamp, providedHmac] = parts;
  const age = Date.now() - Number(timestamp);
  if (isNaN(age) || age < 0 || age > MAX_AGE_SECONDS * 1000) return false;

  const expectedHmac = createHmac("sha256", getPassword())
    .update(timestamp)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(providedHmac, "utf8"),
      Buffer.from(expectedHmac, "utf8"),
    );
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token);
}

export function verifyPassword(password: string): boolean {
  const expected = getPassword();
  try {
    return timingSafeEqual(
      Buffer.from(password, "utf8"),
      Buffer.from(expected, "utf8"),
    );
  } catch {
    return false;
  }
}

export async function requireAuth(): Promise<Response | null> {
  const authed = await isAuthenticated();
  if (!authed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function checkRateLimit(req: Request): Response | null {
  const ip = getClientIp(req);
  const now = Date.now();
  const db = getDb();

  const row = db.select().from(rateLimits).where(eq(rateLimits.ip, ip)).get();

  if (row) {
    const windowStart = Number(row.windowStart);
    if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
      // Window expired — reset
      db.update(rateLimits)
        .set({ attempts: 1, windowStart: now.toString() })
        .where(eq(rateLimits.ip, ip))
        .run();
      return null;
    }

    if (row.attempts >= RATE_LIMIT_MAX) {
      const retryAfter = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - (now - windowStart)) / 1000,
      );
      return Response.json(
        { error: "Too many attempts. Try again later." },
        {
          status: 429,
          headers: { "Retry-After": retryAfter.toString() },
        },
      );
    }

    db.update(rateLimits)
      .set({ attempts: row.attempts + 1 })
      .where(eq(rateLimits.ip, ip))
      .run();
  } else {
    db.insert(rateLimits)
      .values({ ip, attempts: 1, windowStart: now.toString() })
      .run();
  }

  return null;
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
