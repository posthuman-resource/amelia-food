import fs from "fs";
import path from "path";
import { signalMeta } from "@/data/signals";
import type { Signal } from "@/data/signals";

function getTodayEST(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  }); // returns YYYY-MM-DD
}

export function getAllSignals(): Signal[] {
  const dir = path.join(process.cwd(), "data/signals");
  const today = getTodayEST();

  return signalMeta.map((meta) => {
    const text = fs
      .readFileSync(path.join(dir, `${meta.id}.md`), "utf-8")
      .trim();
    return {
      id: meta.id,
      title: meta.title,
      text,
      releaseDate: meta.releaseDate,
      active:
        process.env.UNLOCK_ALL_SIGNALS === "true" || meta.releaseDate <= today,
      targetFreq: meta.targetFreq,
      targetAmp: meta.targetAmp,
      targetHarmonic: meta.targetHarmonic,
      targetShape: meta.targetShape,
      freqTolerance: meta.freqTolerance,
      ampTolerance: meta.ampTolerance,
      harmonicTolerance: meta.harmonicTolerance,
      shapeTolerance: meta.shapeTolerance,
    };
  });
}
