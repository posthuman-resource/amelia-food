import type { TablePosition } from "./types";

export interface WaveTarget {
  targetFreq: number;
  targetAmp: number;
  targetHarmonic: number;
  targetShape: number;
  freqTolerance: number;
  ampTolerance: number;
  harmonicTolerance?: number; // if present, Amy tunes harmonic
  shapeTolerance?: number; // if present, Amy tunes shape
}

export interface Signal {
  id: string;
  title: string;
  text: string;
  releaseDate: string; // YYYY-MM-DD (EST)
  active: boolean; // true if released (based on EST midnight)
  targetFreq: number;
  targetAmp: number;
  targetHarmonic: number;
  targetShape: number; // 0 = sine, 1 = triangle
  freqTolerance: number;
  ampTolerance: number;
  harmonicTolerance: number;
  shapeTolerance: number;
  mode?: "single" | "combination";
  wave1?: WaveTarget;
  wave2?: WaveTarget;
}

export interface SignalMeta {
  id: string;
  title: string;
  releaseDate: string; // YYYY-MM-DD — signal appears on or after this date
  targetFreq: number;
  targetAmp: number;
  targetHarmonic: number;
  targetShape: number; // 0 = sine, 1 = triangle
  freqTolerance: number;
  ampTolerance: number;
  harmonicTolerance: number;
  shapeTolerance: number;
  mode?: "single" | "combination";
  wave1?: WaveTarget;
  wave2?: WaveTarget;
}

export const signalMeta: SignalMeta[] = [
  {
    id: "static",
    title: "static",
    releaseDate: "2026-02-22",
    targetFreq: 2.5,
    targetAmp: 0.4,
    targetHarmonic: 0.6,
    targetShape: 0.3,
    freqTolerance: 0.2,
    ampTolerance: 0.12,
    harmonicTolerance: 0.12,
    shapeTolerance: 0.15,
  },
  {
    id: "contact",
    title: "contact",
    releaseDate: "2026-02-23",
    targetFreq: 1.9,
    targetAmp: 0.55,
    targetHarmonic: 0.5,
    targetShape: 0.7,
    freqTolerance: 0.16,
    ampTolerance: 0.1,
    harmonicTolerance: 0.1,
    shapeTolerance: 0.12,
  },
  {
    id: "frequency",
    title: "frequency",
    releaseDate: "2026-02-24",
    targetFreq: 0.8,
    targetAmp: 0.85,
    targetHarmonic: 0.35,
    targetShape: 0.15,
    freqTolerance: 0.15,
    ampTolerance: 0.1,
    harmonicTolerance: 0.12,
    shapeTolerance: 0.12,
  },
  {
    // #4: combination (3 dial, 2 dial)
    id: "decode",
    title: "decode",
    releaseDate: "2026-02-25",
    targetFreq: 3.1,
    targetAmp: 0.35,
    targetHarmonic: 0.75,
    targetShape: 0.85,
    freqTolerance: 0.2,
    ampTolerance: 0.1,
    harmonicTolerance: 0.12,
    shapeTolerance: 0.15,
    mode: "combination",
    wave1: {
      targetFreq: 3.1,
      targetAmp: 0.35,
      targetHarmonic: 0.75,
      targetShape: 0.85,
      freqTolerance: 0.2,
      ampTolerance: 0.12,
      harmonicTolerance: 0.14,
    },
    wave2: {
      targetFreq: 1.4,
      targetAmp: 0.6,
      targetHarmonic: 0.3,
      targetShape: 0.4,
      freqTolerance: 0.18,
      ampTolerance: 0.14,
    },
  },
  {
    // #5: combination (4 dial, 2 dial)
    id: "carrier-wave",
    title: "carrier wave",
    releaseDate: "2026-02-26",
    targetFreq: 1.5,
    targetAmp: 0.65,
    targetHarmonic: 0.45,
    targetShape: 0.5,
    freqTolerance: 0.14,
    ampTolerance: 0.1,
    harmonicTolerance: 0.1,
    shapeTolerance: 0.12,
    mode: "combination",
    wave1: {
      targetFreq: 1.5,
      targetAmp: 0.65,
      targetHarmonic: 0.45,
      targetShape: 0.5,
      freqTolerance: 0.16,
      ampTolerance: 0.12,
      harmonicTolerance: 0.12,
      shapeTolerance: 0.14,
    },
    wave2: {
      targetFreq: 3.2,
      targetAmp: 0.4,
      targetHarmonic: 0.6,
      targetShape: 0.7,
      freqTolerance: 0.18,
      ampTolerance: 0.14,
    },
  },
  {
    // #6: combination (3 dial, 3 dial)
    id: "transmission",
    title: "transmission",
    releaseDate: "2026-02-27",
    targetFreq: 1.2,
    targetAmp: 0.7,
    targetHarmonic: 0.15,
    targetShape: 0.25,
    freqTolerance: 0.18,
    ampTolerance: 0.12,
    harmonicTolerance: 0.12,
    shapeTolerance: 0.12,
    mode: "combination",
    wave1: {
      targetFreq: 1.2,
      targetAmp: 0.7,
      targetHarmonic: 0.15,
      targetShape: 0.25,
      freqTolerance: 0.2,
      ampTolerance: 0.14,
      harmonicTolerance: 0.14,
    },
    wave2: {
      targetFreq: 2.8,
      targetAmp: 0.45,
      targetHarmonic: 0.5,
      targetShape: 0.6,
      freqTolerance: 0.18,
      ampTolerance: 0.14,
      harmonicTolerance: 0.14,
    },
  },
  {
    // #7: combination (4 dial, 3 dial)
    id: "still-listening",
    title: "still listening",
    releaseDate: "2026-02-28",
    targetFreq: 0.6,
    targetAmp: 0.9,
    targetHarmonic: 0.2,
    targetShape: 0.6,
    freqTolerance: 0.12,
    ampTolerance: 0.1,
    harmonicTolerance: 0.1,
    shapeTolerance: 0.1,
    mode: "combination",
    wave1: {
      targetFreq: 0.6,
      targetAmp: 0.9,
      targetHarmonic: 0.2,
      targetShape: 0.6,
      freqTolerance: 0.18,
      ampTolerance: 0.14,
      harmonicTolerance: 0.14,
      shapeTolerance: 0.14,
    },
    wave2: {
      targetFreq: 1.9,
      targetAmp: 0.5,
      targetHarmonic: 0.4,
      targetShape: 0.15,
      freqTolerance: 0.16,
      ampTolerance: 0.12,
      harmonicTolerance: 0.12,
    },
  },
];

export const signalTable: TablePosition = { x: 50, y: 15, rotation: -1 };
