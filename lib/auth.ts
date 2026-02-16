import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "amelia-auth";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

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

export { COOKIE_NAME, MAX_AGE_SECONDS };
