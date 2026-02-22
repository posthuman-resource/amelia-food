import { requireAuth } from "@/lib/auth";
import { trackState, trackEvent } from "@/lib/analytics";

export async function POST(req: Request) {
  try {
    const authError = await requireAuth();
    if (authError) return authError;

    const body = await req.json();
    const { type } = body;

    if (type === "sync") {
      const { signals } = body;
      if (!Array.isArray(signals)) {
        return Response.json(
          { error: "signals must be an array" },
          { status: 400 },
        );
      }
      trackState(req, "signals", {
        solved: signals,
        count: signals.length,
        lastSync: new Date().toISOString(),
      });
      return Response.json({ ok: true });
    }

    if (type === "signal_solved") {
      const { signal } = body;
      if (typeof signal !== "string") {
        return Response.json(
          { error: "signal must be a string" },
          { status: 400 },
        );
      }
      trackEvent(req, "signal_solved", {
        signal,
        solvedAt: new Date().toISOString(),
      });
      trackState(req, "signals", {
        lastSolved: signal,
        lastSolvedAt: new Date().toISOString(),
      });
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Unknown action type" }, { status: 400 });
  } catch (error) {
    console.error("Analytics error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
