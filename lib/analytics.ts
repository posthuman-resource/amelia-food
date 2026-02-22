import { createHash } from "crypto";
import { getClientIp } from "@/lib/auth";
import { kvSet } from "@/lib/kv";

function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex").slice(0, 8);
}

function analyticsKey(req: Request, key: string): string {
  const ip = getClientIp(req);
  return `analytics:${hashIp(ip)}:${key}`;
}

export function trackState(
  req: Request,
  key: string,
  value: Record<string, unknown>,
): void {
  kvSet(analyticsKey(req, key), value);
}

export function trackEvent(
  req: Request,
  event: string,
  data: Record<string, unknown>,
): void {
  const timestamp = new Date().toISOString();
  kvSet(analyticsKey(req, `${event}:${timestamp}`), data);
}
