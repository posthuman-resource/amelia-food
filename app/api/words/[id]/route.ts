import { deleteWord } from "@/lib/words";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAuth();
  if (denied) return denied;

  const { id } = await params;
  deleteWord(id);
  return Response.json({ ok: true });
}
