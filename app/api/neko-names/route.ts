import { requireAuth } from "@/lib/auth";
import { NEKO_VARIANTS, type NekoVariant } from "@/lib/neko";
import { getNekoNames, setNekoName } from "@/lib/neko.server";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    return Response.json(getNekoNames());
  } catch {
    return Response.json({ error: "Failed to load names" }, { status: 500 });
  }
}

interface PutBody {
  variant: string;
  name: string;
}

export async function PUT(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { variant, name }: PutBody = await req.json();

    if (!variant || !NEKO_VARIANTS.includes(variant as NekoVariant)) {
      return Response.json({ error: "Invalid variant" }, { status: 400 });
    }

    if (typeof name !== "string" || name.length > 30) {
      return Response.json(
        { error: "Name must be 30 characters or fewer" },
        { status: 400 },
      );
    }

    setNekoName(variant as NekoVariant, name);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Failed to save name" }, { status: 500 });
  }
}
