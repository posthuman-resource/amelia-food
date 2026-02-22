import { requireAuth } from "@/lib/auth";
import { getTransmissions, createTransmission } from "@/lib/transmissions";

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const messages = getTransmissions();
    return Response.json({ messages });
  } catch (error) {
    console.error("Failed to fetch transmissions:", error);
    return Response.json(
      { error: "Failed to fetch transmissions" },
      { status: 500 },
    );
  }
}

interface CreateTransmissionBody {
  text: string;
}

export async function POST(req: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  try {
    const { text }: CreateTransmissionBody = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    if (text.length > 2000) {
      return Response.json(
        { error: "Text must be 2000 characters or fewer" },
        { status: 400 },
      );
    }

    const message = createTransmission(text);
    return Response.json({ message });
  } catch (error) {
    console.error("Failed to create transmission:", error);
    return Response.json(
      { error: "Failed to create transmission" },
      { status: 500 },
    );
  }
}
