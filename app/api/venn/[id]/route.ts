import { getDb } from "@/db/client";
import { vennEntries } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  getDb().delete(vennEntries).where(eq(vennEntries.id, id)).run();
  return Response.json({ ok: true });
}
