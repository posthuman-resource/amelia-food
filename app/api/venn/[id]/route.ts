import { getDb } from "@/db/client";
import { vennEntries } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  getDb().delete(vennEntries).where(eq(vennEntries.id, id)).run();
  return Response.json({ ok: true });
}
