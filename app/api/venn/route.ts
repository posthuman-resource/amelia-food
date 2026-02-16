import { getDb } from "@/db/client";
import { vennEntries } from "@/db/schema";

interface CreateVennEntryBody {
  text: string;
  section: string;
}

export async function POST(req: Request) {
  const { text, section }: CreateVennEntryBody = await req.json();

  if (!text || !section || !["left", "right", "both"].includes(section)) {
    return Response.json({ error: "Invalid entry" }, { status: 400 });
  }

  const entry = {
    id: crypto.randomUUID(),
    text: text.trim(),
    section,
    createdAt: new Date().toISOString(),
  };

  getDb().insert(vennEntries).values(entry).run();

  return Response.json(entry);
}
