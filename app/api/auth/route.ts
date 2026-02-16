import { cookies } from "next/headers";
import {
  verifyPassword,
  createToken,
  COOKIE_NAME,
  MAX_AGE_SECONDS,
} from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = (await req.json()) as { password: string };

  if (!verifyPassword(password)) {
    return Response.json({ error: "wrong password" }, { status: 401 });
  }

  const token = createToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
