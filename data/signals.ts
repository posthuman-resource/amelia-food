import type { TablePosition } from "./types";

export interface Signal {
  id: string;
  title: string;
  text: string;
  releaseDate: string; // YYYY-MM-DD (EST)
  active: boolean; // true if released (based on EST midnight)
  targetFreq: number;
  targetAmp: number;
  targetHarmonic: number;
  freqTolerance: number;
  ampTolerance: number;
  harmonicTolerance: number;
}

export interface SignalMeta {
  id: string;
  title: string;
  releaseDate: string; // YYYY-MM-DD — signal appears on or after this date
  targetFreq: number;
  targetAmp: number;
  targetHarmonic: number;
  freqTolerance: number;
  ampTolerance: number;
  harmonicTolerance: number;
}

export const signalMeta: SignalMeta[] = [
  {
    id: "static",
    title: "static",
    releaseDate: "2026-02-22",
    targetFreq: 2.5,
    targetAmp: 0.4,
    targetHarmonic: 0.6,
    freqTolerance: 0.2,
    ampTolerance: 0.12,
    harmonicTolerance: 0.12,
  },
  {
    id: "contact",
    title: "contact",
    releaseDate: "2026-02-23",
    targetFreq: 1.9,
    targetAmp: 0.55,
    targetHarmonic: 0.5,
    freqTolerance: 0.16,
    ampTolerance: 0.1,
    harmonicTolerance: 0.1,
  },
  {
    id: "frequency",
    title: "frequency",
    releaseDate: "2026-02-24",
    targetFreq: 0.8,
    targetAmp: 0.85,
    targetHarmonic: 0.35,
    freqTolerance: 0.15,
    ampTolerance: 0.1,
    harmonicTolerance: 0.12,
  },
  {
    id: "decode",
    title: "decode",
    releaseDate: "2026-02-25",
    targetFreq: 3.1,
    targetAmp: 0.35,
    targetHarmonic: 0.75,
    freqTolerance: 0.2,
    ampTolerance: 0.1,
    harmonicTolerance: 0.12,
  },
  {
    id: "carrier-wave",
    title: "carrier wave",
    releaseDate: "2026-02-26",
    targetFreq: 1.5,
    targetAmp: 0.65,
    targetHarmonic: 0.45,
    freqTolerance: 0.14,
    ampTolerance: 0.1,
    harmonicTolerance: 0.1,
  },
  {
    id: "transmission",
    title: "transmission",
    releaseDate: "2026-02-27",
    targetFreq: 1.2,
    targetAmp: 0.7,
    targetHarmonic: 0.15,
    freqTolerance: 0.18,
    ampTolerance: 0.12,
    harmonicTolerance: 0.12,
  },
  {
    id: "still-listening",
    title: "still listening",
    releaseDate: "2026-02-28",
    targetFreq: 0.6,
    targetAmp: 0.9,
    targetHarmonic: 0.2,
    freqTolerance: 0.12,
    ampTolerance: 0.1,
    harmonicTolerance: 0.1,
  },
];

export const signalTable: TablePosition = { x: 50, y: 15, rotation: -1 };
