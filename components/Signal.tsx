"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Signal, WaveTarget } from "@/data/signals";
import { useAudioEnabled } from "@/hooks/useAudioEnabled";
import styles from "./Signal.module.css";

const STORAGE_KEY = "signal-found-channels";
const MATCH_FRAMES_REQUIRED = 60;

function isCombination(
  s: Signal,
): s is Signal & { mode: "combination"; wave1: WaveTarget; wave2: WaveTarget } {
  return s.mode === "combination" && !!s.wave1 && !!s.wave2;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  return `${months[m - 1]} ${d}`;
}

function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

function garbleText(
  text: string,
  seed: string,
  tick: number,
  progress: number = 0,
): string {
  const pool = "abcdefghijklmnopqrstuvwxyz ";

  // Garble hash
  let gh = 0;
  for (let i = 0; i < seed.length; i++) {
    gh = ((gh << 5) - gh + seed.charCodeAt(i)) | 0;
  }
  gh = ((gh << 5) - gh + tick * 13) | 0;

  // Reveal threshold hash (different seed so reveal order != garble pattern)
  let th = 0;
  for (let i = 0; i < seed.length; i++) {
    th = ((th << 5) - th + seed.charCodeAt(i) * 3 + 7) | 0;
  }

  return text
    .split("")
    .map((ch, i) => {
      if (ch === "\n") return "\n";

      // Each character has a fixed reveal threshold (0–1)
      th = ((th << 5) - th + i * 17 + 3) | 0;
      const threshold = (Math.abs(th) % 1000) / 1000;
      if (progress >= threshold) return ch;

      // Still garbled — shifts with tick
      gh = ((gh << 5) - gh + i * 7 + 1) | 0;
      return pool[Math.abs(gh) % pool.length];
    })
    .join("");
}

function getFoundChannels(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveFoundChannel(id: string) {
  const found = getFoundChannels();
  if (!found.includes(id)) {
    found.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
  }
}

function reportSignalSolved(id: string) {
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "signal_solved", signal: id }),
  }).catch(() => {});
}

/* ========================================
   Card Face — animated waveform on table
   ======================================== */

export function SignalCardFace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(Math.random() * 100); // random start offset

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 88 * dpr;
    canvas.height = 44 * dpr;

    function tick() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const t = timeRef.current;
      timeRef.current += 0.015;

      ctx.clearRect(0, 0, w, h);

      // Slowly modulating parameters
      const freq = 3.0 + Math.sin(t * 0.13) * 1.5; // 1.5–4.5 cycles
      const harmonic = Math.sin(t * 0.09) * 0.5 + 0.5; // 0–1
      const amp = 0.55 + Math.sin(t * 0.17) * 0.25; // 0.3–0.8

      ctx.strokeStyle = "rgba(196, 162, 101, 0.7)";
      ctx.lineWidth = 1.5 * (window.devicePixelRatio || 1);
      ctx.lineCap = "round";
      ctx.beginPath();

      for (let px = 0; px < w; px++) {
        const x = px / w;
        const fundamental = Math.sin(2 * Math.PI * freq * x + t * 1.2);
        const overtone = Math.sin(2 * Math.PI * freq * 2 * x + t * 1.8);
        const blended =
          fundamental * (1 - harmonic * 0.5) + overtone * harmonic * 0.5;
        const y = h / 2 + blended * amp * h * 0.4;
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className={styles.face}>
      <canvas
        ref={canvasRef}
        className={styles.faceCanvas}
        aria-hidden="true"
      />
      <div className={styles.faceScanline} />
    </div>
  );
}

/* ========================================
   Voice Audio — distortion helpers
   ======================================== */

function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  // amount 0 = linear (clean), 1 = hard sigmoid clip
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    if (amount <= 0) {
      curve[i] = x;
    } else {
      const k = amount * 50;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
  }
  return curve;
}

// Pre-compute 21 distortion curve levels to avoid GC/click artifacts
const DISTORTION_CURVES: Float32Array<ArrayBuffer>[] = Array.from(
  { length: 21 },
  (_, i) => makeDistortionCurve(i / 20),
);

// Persistent audio buffer cache across re-renders
const audioBufferCache = new Map<string, AudioBuffer>();

async function loadVoiceBuffer(
  ctx: AudioContext,
  signalId: string,
): Promise<AudioBuffer | null> {
  const cached = audioBufferCache.get(signalId);
  if (cached) return cached;

  // Try .m4a (original AAC recordings) first, fall back to .wav (dummies)
  for (const ext of ["m4a", "wav"]) {
    try {
      const resp = await fetch(`/audio/signals/${signalId}.${ext}`);
      if (!resp.ok) continue;
      const arrayBuf = await resp.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(arrayBuf);
      audioBufferCache.set(signalId, audioBuf);
      return audioBuf;
    } catch {
      continue;
    }
  }
  return null;
}

/* ========================================
   Audio Engine (Web Audio API)
   ======================================== */

interface FragmentScheduler {
  nextFragmentTime: number;
  lastProximity: number;
  isActive: boolean;
}

interface VoiceEngine {
  filter: BiquadFilterNode;
  waveshaper: WaveShaperNode;
  fragmentGate: GainNode;
  voiceMaster: GainNode;
  source: AudioBufferSourceNode | null;
  buffer: AudioBuffer | null;
  lastCurveLevel: number;

  // Pitch wobble LFO (analog tuning drift)
  lfo: OscillatorNode;
  lfoDepth: GainNode;

  // Noise layer
  noiseBuffer: AudioBuffer;
  noiseSource: AudioBufferSourceNode | null;
  noiseFilter: BiquadFilterNode;
  noiseMaster: GainNode;

  // Clean playback path
  cleanSource: AudioBufferSourceNode | null;
  cleanGain: GainNode;

  fragmentScheduler: FragmentScheduler;
}

interface AudioEngine {
  ctx: AudioContext;
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  osc1tri: OscillatorNode;
  osc2tri: OscillatorNode;
  gain1: GainNode;
  gain2: GainNode;
  gain1tri: GainNode;
  gain2tri: GainNode;
  master: GainNode;
  voice: VoiceEngine;
}

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function createAudioEngine(): AudioEngine {
  const ctx = new AudioContext();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const osc1tri = ctx.createOscillator();
  const osc2tri = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();
  const gain1tri = ctx.createGain();
  const gain2tri = ctx.createGain();
  const master = ctx.createGain();

  osc1.type = "sine";
  osc2.type = "sine";
  osc1tri.type = "triangle";
  osc2tri.type = "triangle";

  osc1.connect(gain1).connect(master);
  osc2.connect(gain2).connect(master);
  osc1tri.connect(gain1tri).connect(master);
  osc2tri.connect(gain2tri).connect(master);
  master.connect(ctx.destination);

  master.gain.value = 0.06;
  gain1.gain.value = 0;
  gain2.gain.value = 0;
  gain1tri.gain.value = 0;
  gain2tri.gain.value = 0;

  osc1.start();
  osc2.start();
  osc1tri.start();
  osc2tri.start();

  // Voice fragment chain: source → filter → waveshaper → fragmentGate → voiceMaster → destination
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 3500;
  filter.Q.value = 0.5;

  const waveshaper = ctx.createWaveShaper();
  waveshaper.curve = DISTORTION_CURVES[0];
  waveshaper.oversample = "2x";

  const fragmentGate = ctx.createGain();
  fragmentGate.gain.value = 0; // closed by default

  const voiceMaster = ctx.createGain();
  voiceMaster.gain.value = 1.0;

  filter.connect(waveshaper);
  waveshaper.connect(fragmentGate);
  fragmentGate.connect(voiceMaster);
  voiceMaster.connect(ctx.destination);

  // Noise layer: noiseSource → noiseFilter → noiseMaster → destination
  const noiseBuffer = createNoiseBuffer(ctx);

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 2200;
  noiseFilter.Q.value = 0.8;

  const noiseMaster = ctx.createGain();
  noiseMaster.gain.value = 0;

  noiseFilter.connect(noiseMaster);
  noiseMaster.connect(ctx.destination);

  // Pitch wobble LFO: lfo → lfoDepth → source.detune (connected per-source)
  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 4.0; // wobble rate in Hz
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 200; // depth in cents (±200 = wide warble)
  lfo.connect(lfoDepth);
  lfo.start();

  // Clean playback path: cleanSource → cleanGain → destination
  const cleanGain = ctx.createGain();
  cleanGain.gain.value = 0;
  cleanGain.connect(ctx.destination);

  const voice: VoiceEngine = {
    filter,
    waveshaper,
    fragmentGate,
    voiceMaster,
    source: null,
    buffer: null,
    lastCurveLevel: 0,
    lfo,
    lfoDepth,
    noiseBuffer,
    noiseSource: null,
    noiseFilter,
    noiseMaster,
    cleanSource: null,
    cleanGain,
    fragmentScheduler: {
      nextFragmentTime: 0,
      lastProximity: 0,
      isActive: false,
    },
  };

  return {
    ctx,
    osc1,
    osc2,
    osc1tri,
    osc2tri,
    gain1,
    gain2,
    gain1tri,
    gain2tri,
    master,
    voice,
  };
}

function ensureContextRunning(ctx: AudioContext) {
  if (ctx.state === "suspended") ctx.resume();
}

function startVoiceLoop(engine: AudioEngine) {
  const { ctx, voice } = engine;
  if (!voice.buffer) return;

  ensureContextRunning(ctx);

  // Stop existing sources if any
  stopVoice(engine);

  // Start looping voice source (gate is closed, so inaudible until fragments fire)
  const source = ctx.createBufferSource();
  source.buffer = voice.buffer;
  source.loop = true;
  source.connect(voice.filter);
  // Connect pitch wobble LFO to detune for analog tuning drift
  voice.lfoDepth.connect(source.detune);
  source.start();
  voice.source = source;
  voice.fragmentGate.gain.value = 0;

  // Start noise source
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = voice.noiseBuffer;
  noiseSource.loop = true;
  noiseSource.connect(voice.noiseFilter);
  noiseSource.start();
  voice.noiseSource = noiseSource;

  // Activate fragment scheduler
  voice.fragmentScheduler.isActive = true;
  voice.fragmentScheduler.nextFragmentTime = ctx.currentTime + 0.5;
  voice.fragmentScheduler.lastProximity = 0;
}

function stopVoice(engine: AudioEngine) {
  const { voice } = engine;
  // Stop looping voice source
  if (voice.source) {
    try {
      voice.source.onended = null;
      voice.source.stop();
      voice.source.disconnect();
    } catch {
      // already stopped
    }
    voice.source = null;
  }
  // Stop noise source
  if (voice.noiseSource) {
    try {
      voice.noiseSource.stop();
      voice.noiseSource.disconnect();
    } catch {
      // already stopped
    }
    voice.noiseSource = null;
  }
  // Stop clean source
  if (voice.cleanSource) {
    try {
      voice.cleanSource.onended = null;
      voice.cleanSource.stop();
      voice.cleanSource.disconnect();
    } catch {
      // already stopped
    }
    voice.cleanSource = null;
  }
  // Deactivate fragment scheduler
  voice.fragmentScheduler.isActive = false;
}

function transitionToCleanPlayback(engine: AudioEngine, onEnded?: () => void) {
  const { ctx, voice } = engine;
  if (!voice.buffer) return;
  const t = ctx.currentTime;

  // 1. Cancel any scheduled fragment gains, fade gate to 0
  voice.fragmentGate.gain.cancelScheduledValues(t);
  voice.fragmentGate.gain.setValueAtTime(voice.fragmentGate.gain.value, t);
  voice.fragmentGate.gain.linearRampToValueAtTime(0, t + 0.3);

  // 2. Fade noise to 0
  voice.noiseMaster.gain.cancelScheduledValues(t);
  voice.noiseMaster.gain.setTargetAtTime(0, t, 0.12);

  // 3. Fade oscillator tone down so it doesn't compete with the clean voice
  engine.master.gain.setTargetAtTime(0.01, t, 0.15);

  // 4. Deactivate fragment scheduler
  voice.fragmentScheduler.isActive = false;

  // 5. After fade-out, stop looping sources and start clean playback
  setTimeout(() => {
    // Stop looping voice + noise
    if (voice.source) {
      try {
        voice.source.stop();
        voice.source.disconnect();
      } catch {
        /* already stopped */
      }
      voice.source = null;
    }
    if (voice.noiseSource) {
      try {
        voice.noiseSource.stop();
        voice.noiseSource.disconnect();
      } catch {
        /* already stopped */
      }
      voice.noiseSource = null;
    }

    // Start clean one-shot playback
    const cleanSource = ctx.createBufferSource();
    cleanSource.buffer = voice.buffer;
    cleanSource.loop = false;
    cleanSource.connect(voice.cleanGain);
    // Restore oscillator to softer matched volume when voice finishes
    cleanSource.onended = () => {
      engine.master.gain.setTargetAtTime(0.04, ctx.currentTime, 0.3);
      if (onEnded) onEnded();
    };
    cleanSource.start();
    voice.cleanSource = cleanSource;

    // Fade clean gain in
    const now = ctx.currentTime;
    voice.cleanGain.gain.setValueAtTime(0, now);
    voice.cleanGain.gain.linearRampToValueAtTime(0.7, now + 0.15);
  }, 350);
}

function playCleanVoice(engine: AudioEngine, onEnded?: () => void) {
  const { ctx, voice } = engine;
  if (!voice.buffer) return;

  // Stop any existing clean source
  if (voice.cleanSource) {
    try {
      voice.cleanSource.onended = null;
      voice.cleanSource.stop();
      voice.cleanSource.disconnect();
    } catch {
      /* already stopped */
    }
    voice.cleanSource = null;
  }

  // Fade oscillator down during voice playback
  engine.master.gain.setTargetAtTime(0.01, ctx.currentTime, 0.15);

  const cleanSource = ctx.createBufferSource();
  cleanSource.buffer = voice.buffer;
  cleanSource.loop = false;
  cleanSource.connect(voice.cleanGain);
  // Restore oscillator to softer matched volume when voice ends
  const wrappedOnEnded = () => {
    engine.master.gain.setTargetAtTime(0.04, ctx.currentTime, 0.3);
    if (onEnded) onEnded();
  };
  cleanSource.onended = wrappedOnEnded;
  cleanSource.start();
  voice.cleanSource = cleanSource;

  const t = ctx.currentTime;
  voice.cleanGain.gain.setValueAtTime(0, t);
  voice.cleanGain.gain.linearRampToValueAtTime(0.7, t + 0.15);
}

function updateVoiceEffects(
  engine: AudioEngine,
  _freqOff: number,
  _ampOff: number,
  _harmOff: number,
  muted: boolean,
  proximity: number,
) {
  const { ctx, voice } = engine;
  const t = ctx.currentTime;
  const tc = 0.05; // time constant for smooth transitions
  const p = clamp(proximity, 0, 1);

  // Voice master: mute/unmute
  voice.voiceMaster.gain.setTargetAtTime(muted ? 0 : 1.0, t, tc);

  // All effects driven by proximity:
  // p=0 (far): heavy distortion, narrow muffled band, slowed playback
  // p=1 (close): lighter distortion, wider band, near-normal speed
  // (still never fully clean — the transition to clean playback handles that)

  // Bandpass filter: opens up as you get closer
  const filterFreq = 800 + p * 2200; // 800Hz → 3000Hz
  const filterQ = 8.0 - p * 6.0; // 8 → 2 (tight → open)
  voice.filter.frequency.setTargetAtTime(filterFreq, t, tc);
  voice.filter.Q.setTargetAtTime(filterQ, t, tc);

  // Waveshaper distortion: heavy when far, light when close
  const distortion = 0.85 - p * 0.55; // 0.85 → 0.30
  const curveLevel = Math.round(clamp(distortion, 0, 1) * 20);
  if (curveLevel !== voice.lastCurveLevel) {
    voice.waveshaper.curve = DISTORTION_CURVES[curveLevel];
    voice.lastCurveLevel = curveLevel;
  }

  // Pitch wobble LFO: wide erratic drift when far, barely perceptible when close
  const wobbleDepth = 220 * (1 - p) * (1 - p); // ±220 → ±0 cents (quadratic)
  const wobbleRate = 3.0 + (1 - p) * 5.0; // 3Hz → 8Hz (faster = more chaotic when far)
  voice.lfoDepth.gain.setTargetAtTime(wobbleDepth, t, 0.1);
  voice.lfo.frequency.setTargetAtTime(wobbleRate, t, 0.1);

  // Noise gain: fades out as proximity increases (crossfade with voice fragments)
  const noiseFade = (1 - p) * (1 - p) * (1 - p); // cubic falloff
  const noiseGain = muted ? 0 : 0.08 * noiseFade;
  voice.noiseMaster.gain.setTargetAtTime(noiseGain, t, 0.1);

  // Noise filter shifts with proximity
  const noiseFreq = 2200 + (1 - p) * 600;
  voice.noiseFilter.frequency.setTargetAtTime(noiseFreq, t, tc);
}

function scheduleFragments(engine: AudioEngine, proximity: number) {
  const { ctx, voice } = engine;
  const sched = voice.fragmentScheduler;
  if (!sched.isActive) return;

  const now = ctx.currentTime;

  // Smooth proximity to prevent scheduling chaos from rapid dial movement
  sched.lastProximity += (proximity - sched.lastProximity) * 0.15;
  const p = clamp(sched.lastProximity, 0, 1);

  if (now < sched.nextFragmentTime) return;

  // Fragment parameters scale with proximity
  const pp = p * p; // accelerating curve

  // Interval: 0.4-0.8s at p=0, 0.06-0.2s at p=0.9+ (more frequent overall)
  const baseInterval = 0.4 - pp * 0.34; // 0.4 → 0.06
  const intervalRange = 0.4 - pp * 0.2; // 0.4 → 0.2
  const jitter = 1.0 + (Math.random() - 0.5) * 0.6; // ±30%
  const interval = Math.max(
    0.05,
    (baseInterval + Math.random() * intervalRange) * jitter,
  );

  // Duration: 500-900ms at p=0, 1.4-2.2s at p=0.9+ (slightly longer)
  const baseDuration = 0.5 + pp * 0.9; // 500ms → 1400ms
  const durationRange = 0.4 + pp * 0.4; // 400ms → 800ms
  const durJitter = 1.0 + (Math.random() - 0.5) * 0.5; // ±25%
  const duration = Math.max(
    0.25,
    (baseDuration + Math.random() * durationRange) * durJitter,
  );

  // Peak gain: 0.60 at p=0, 1.0 at p=0.9+ (louder fragments)
  const peakGain = 0.6 + pp * 0.4;

  // Schedule gain envelope: very slow fades — voice swells in and out of static
  const fadeIn = Math.max(0.15, duration * 0.45);
  const fadeOut = Math.max(0.2, duration * 0.45);
  const sustainEnd = now + duration - fadeOut;

  const gate = voice.fragmentGate.gain;
  gate.setValueAtTime(0, now);
  gate.linearRampToValueAtTime(peakGain, now + fadeIn);
  if (sustainEnd > now + fadeIn) {
    gate.setValueAtTime(peakGain, sustainEnd);
  }
  gate.linearRampToValueAtTime(0, now + duration);

  sched.nextFragmentTime = now + duration + interval;
}

function updateAudio(
  engine: AudioEngine,
  freq: number,
  amp: number,
  harmonic: number,
  shape: number,
  muted: boolean,
) {
  const t = engine.ctx.currentTime;
  const audioFreq = 80 + freq * 120;
  const volume = muted ? 0 : amp;

  engine.osc1.frequency.setTargetAtTime(audioFreq, t, 0.02);
  engine.osc2.frequency.setTargetAtTime(audioFreq * 2, t, 0.02);
  engine.osc1tri.frequency.setTargetAtTime(audioFreq, t, 0.02);
  engine.osc2tri.frequency.setTargetAtTime(audioFreq * 2, t, 0.02);

  // Fundamental gets quieter as harmonic increases; overtone gets louder
  const fundVol = volume * (1 - harmonic * 0.4);
  const harmVol = volume * harmonic * 0.6;

  // Crossfade sine/triangle based on shape (0 = all sine, 1 = all triangle)
  engine.gain1.gain.setTargetAtTime(fundVol * (1 - shape), t, 0.02);
  engine.gain2.gain.setTargetAtTime(harmVol * (1 - shape), t, 0.02);
  engine.gain1tri.gain.setTargetAtTime(fundVol * shape, t, 0.02);
  engine.gain2tri.gain.setTargetAtTime(harmVol * shape, t, 0.02);
}

function destroyAudioEngine(engine: AudioEngine) {
  stopVoice(engine);
  engine.voice.lfo.stop();
  engine.osc1.stop();
  engine.osc2.stop();
  engine.osc1tri.stop();
  engine.osc2tri.stop();
  engine.ctx.close();
}

/* ========================================
   Canvas Drawing
   ======================================== */

interface DrawParams {
  targetFreq: number;
  targetAmp: number;
  targetHarmonic: number;
  targetShape: number;
  userFreq: number;
  userAmp: number;
  userHarmonic: number;
  userShape: number;
  proximity: number;
  time: number;
  isDark: boolean;
  comboPhase?: 1 | 2;
  wave1Target?: WaveTarget;
  wave2Target?: WaveTarget;
  lockedWave1?: {
    freq: number;
    amp: number;
    harmonic: number;
    shape: number;
  } | null;
}

function waveY(
  x: number,
  freq: number,
  amp: number,
  harmonic: number,
  shape: number,
  midY: number,
  ampScale: number,
  time: number,
) {
  const phase1 = 2 * Math.PI * freq * x * 4 + time;
  const phase2 = 2 * Math.PI * freq * 2 * x * 4 + time;
  const sin1 = Math.sin(phase1);
  const sin2 = Math.sin(phase2);
  const tri1 = Math.asin(sin1) / (Math.PI / 2);
  const tri2 = Math.asin(sin2) / (Math.PI / 2);
  const wave1 = sin1 * (1 - shape) + tri1 * shape;
  const wave2 = sin2 * (1 - shape) + tri2 * shape;
  const blended = wave1 * (1 - harmonic * 0.4) + wave2 * harmonic * 0.6;
  return midY + blended * amp * ampScale;
}

function combinedWaveY(
  x: number,
  w1: { freq: number; amp: number; harmonic: number; shape: number },
  w2: { freq: number; amp: number; harmonic: number; shape: number },
  midY: number,
  ampScale: number,
  time: number,
) {
  const y1 = waveY(
    x,
    w1.freq,
    w1.amp,
    w1.harmonic,
    w1.shape,
    midY,
    ampScale,
    time,
  );
  const y2 = waveY(
    x,
    w2.freq,
    w2.amp,
    w2.harmonic,
    w2.shape,
    midY,
    ampScale,
    time,
  );
  return y1 + (y2 - midY); // sum offsets from center
}

function drawCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: DrawParams,
) {
  const {
    targetFreq,
    targetAmp,
    targetHarmonic,
    targetShape,
    userFreq,
    userAmp,
    userHarmonic,
    userShape,
    proximity,
    time,
    isDark,
  } = params;

  // Background
  ctx.fillStyle = isDark ? "#0f0d0a" : "#1a1612";
  ctx.fillRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = isDark
    ? "rgba(255,255,255,0.04)"
    : "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 6]);

  const gridCols = 12;
  for (let i = 1; i < gridCols; i++) {
    const x = (width / gridCols) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const gridRows = 6;
  for (let i = 1; i < gridRows; i++) {
    const y = (height / gridRows) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Center line
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  const midY = height / 2;
  const ampScale = height * 0.35;

  // Draw single wave helper
  function drawWave(
    freq: number,
    amp: number,
    harmonic: number,
    shape: number,
    color: string,
    alpha: number,
    glowStrength: number,
    dashed?: boolean,
  ) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    if (dashed) ctx.setLineDash([6, 4]);

    if (glowStrength > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * glowStrength;
    }

    ctx.beginPath();
    for (let px = 0; px < width; px++) {
      const x = px / width;
      const y = waveY(x, freq, amp, harmonic, shape, midY, ampScale, time);
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Draw combined (two-wave sum) helper
  function drawCombinedWave(
    w1: { freq: number; amp: number; harmonic: number; shape: number },
    w2: { freq: number; amp: number; harmonic: number; shape: number },
    color: string,
    alpha: number,
    glowStrength: number,
  ) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    if (glowStrength > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 8 * glowStrength;
    }

    ctx.beginPath();
    for (let px = 0; px < width; px++) {
      const x = px / width;
      const y = combinedWaveY(x, w1, w2, midY, ampScale, time);
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  const goldColor = isDark ? "#d4b878" : "#c4a265";
  const greenColor = isDark ? "#4a8b6b" : "#3a6b5b";
  const { comboPhase, wave1Target, wave2Target, lockedWave1 } = params;
  const isCombo = comboPhase && wave1Target && wave2Target;

  if (isCombo && comboPhase === 1) {
    // Phase 1: gold = wave1 target, green = Amy's wave
    const targetAlpha = 0.15 + proximity * 0.85;
    const targetGlow = isDark ? proximity * 1.3 : proximity;
    drawWave(
      wave1Target.targetFreq,
      wave1Target.targetAmp,
      wave1Target.targetHarmonic,
      wave1Target.targetShape,
      goldColor,
      targetAlpha,
      targetGlow,
    );
    // User wave: use userHarmonic/userShape when tunable, else fixed from config
    drawWave(
      userFreq,
      userAmp,
      wave1Target.harmonicTolerance !== undefined
        ? userHarmonic
        : wave1Target.targetHarmonic,
      wave1Target.shapeTolerance !== undefined
        ? userShape
        : wave1Target.targetShape,
      greenColor,
      0.9,
      isDark ? 0.6 : 0.3,
    );
  } else if (isCombo && comboPhase === 2 && lockedWave1) {
    // Phase 2: gold = combined target (wave1+wave2), green = locked A + Amy's B combined
    const targetAlpha = 0.15 + proximity * 0.85;
    const targetGlow = isDark ? proximity * 1.3 : proximity;
    drawCombinedWave(
      {
        freq: wave1Target.targetFreq,
        amp: wave1Target.targetAmp,
        harmonic: wave1Target.targetHarmonic,
        shape: wave1Target.targetShape,
      },
      {
        freq: wave2Target.targetFreq,
        amp: wave2Target.targetAmp,
        harmonic: wave2Target.targetHarmonic,
        shape: wave2Target.targetShape,
      },
      goldColor,
      targetAlpha,
      targetGlow,
    );

    // Faint dashed reference: locked wave1 alone
    drawWave(
      lockedWave1.freq,
      lockedWave1.amp,
      lockedWave1.harmonic,
      lockedWave1.shape,
      goldColor,
      0.15,
      0,
      true,
    );

    // Green = locked A + Amy's B combined
    drawCombinedWave(
      {
        freq: lockedWave1.freq,
        amp: lockedWave1.amp,
        harmonic: lockedWave1.harmonic,
        shape: lockedWave1.shape,
      },
      {
        freq: userFreq,
        amp: userAmp,
        harmonic:
          wave2Target.harmonicTolerance !== undefined
            ? userHarmonic
            : wave2Target.targetHarmonic,
        shape:
          wave2Target.shapeTolerance !== undefined
            ? userShape
            : wave2Target.targetShape,
      },
      greenColor,
      0.9,
      isDark ? 0.6 : 0.3,
    );
  } else {
    // Single mode (default)
    const targetAlpha = 0.15 + proximity * 0.85;
    const targetGlow = isDark ? proximity * 1.3 : proximity;
    drawWave(
      targetFreq,
      targetAmp,
      targetHarmonic,
      targetShape,
      goldColor,
      targetAlpha,
      targetGlow,
    );
    drawWave(
      userFreq,
      userAmp,
      userHarmonic,
      userShape,
      greenColor,
      0.9,
      isDark ? 0.6 : 0.3,
    );
  }

  // Noise
  const noiseAlpha = (1 - proximity) * 0.6;
  if (noiseAlpha > 0.01) {
    ctx.fillStyle = isDark
      ? `rgba(255,255,255,${noiseAlpha * 0.3})`
      : `rgba(255,255,255,${noiseAlpha * 0.4})`;
    const noiseCount = Math.floor((1 - proximity) * 120);
    for (let i = 0; i < noiseCount; i++) {
      const nx = ((Math.sin(i * 127.1 + time * 3) * 0.5 + 0.5) * width) % width;
      const ny =
        ((Math.cos(i * 269.5 + time * 2) * 0.5 + 0.5) * height) % height;
      ctx.fillRect(nx, ny, 1.5, 1.5);
    }
  }

  // Scanline sweep
  const scanPos = ((time * 0.3) % 1) * width;
  const scanGrad = ctx.createLinearGradient(scanPos - 40, 0, scanPos + 40, 0);
  scanGrad.addColorStop(0, "transparent");
  scanGrad.addColorStop(
    0.5,
    isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.04)",
  );
  scanGrad.addColorStop(1, "transparent");
  ctx.fillStyle = scanGrad;
  ctx.fillRect(scanPos - 40, 0, 80, height);
}

/* ========================================
   Dial — rotary knob control
   ======================================== */

function Dial({
  value,
  min,
  max,
  step,
  onChange,
  label,
  keys,
  id,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
  keys: [string, string];
  id: string;
}) {
  const dragRef = useRef<{ startY: number; startVal: number } | null>(null);

  const normalized = (value - min) / (max - min);
  const angle = -135 + normalized * 270;
  const sensitivity = (max - min) / 180;

  function handlePointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startVal: value };
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dy = dragRef.current.startY - e.clientY;
    const raw = dragRef.current.startVal + dy * sensitivity;
    const clamped = clamp(raw, min, max);
    const snapped = Math.round(clamped / step) * step;
    onChange(snapped);
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  return (
    <div className={styles.dialGroup}>
      <span className={styles.dialLabel}>{label}</span>
      <div
        className={styles.dial}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={Math.round(value * 100) / 100}
        id={id}
        tabIndex={0}
      >
        <div
          className={styles.dialRotor}
          style={{ transform: `rotate(${angle}deg)` }}
        >
          <div className={styles.dialNotch} />
        </div>
      </div>
      <span className={styles.dialKeys}>
        <span className={styles.key}>{keys[0]}</span>
        <span className={styles.key}>{keys[1]}</span>
      </span>
    </div>
  );
}

/* ========================================
   Signal Content — Modal
   ======================================== */

type VoiceState = "idle" | "tuning" | "matched" | "revealed" | "replaying";

interface SignalContentProps {
  signals: Signal[];
}

export function SignalContent({ signals }: SignalContentProps) {
  const [activeChannel, setActiveChannel] = useState(0);
  const [foundChannels, setFoundChannels] = useState<string[]>([]);
  const [userFreq, setUserFreq] = useState(1.0);
  const [userAmp, setUserAmp] = useState(0.5);
  const [userHarmonic, setUserHarmonic] = useState(0.0);
  const [userShape, setUserShape] = useState(0.0);
  const [matchFrames, setMatchFrames] = useState(0);
  const [matched, setMatched] = useState(false);
  const [audioEnabled, toggleAudioEnabled] = useAudioEnabled();
  const [garbleTick, setGarbleTick] = useState(0);
  const [revealProgress, setRevealProgress] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [comboPhase, setComboPhase] = useState<1 | 2>(1);
  const [lockedWave1, setLockedWave1] = useState<{
    freq: number;
    amp: number;
    harmonic: number;
    shape: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const matchFramesRef = useRef(0);
  const isDarkRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const userFreqRef = useRef(userFreq);
  const userAmpRef = useRef(userAmp);
  const userHarmonicRef = useRef(userHarmonic);
  const userShapeRef = useRef(userShape);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const audioMutedRef = useRef(!audioEnabled);
  const garbleTickRef = useRef(0);
  const revealStartRef = useRef<number | null>(null);
  const voiceLoadedRef = useRef<string | null>(null);
  const voiceStateRef = useRef<VoiceState>("idle");
  const comboPhaseRef = useRef<1 | 2>(1);
  const lockedWave1Ref = useRef<{
    freq: number;
    amp: number;
    harmonic: number;
    shape: number;
  } | null>(null);
  comboPhaseRef.current = comboPhase;
  lockedWave1Ref.current = lockedWave1;
  userFreqRef.current = userFreq;
  userAmpRef.current = userAmp;
  userHarmonicRef.current = userHarmonic;
  userShapeRef.current = userShape;
  audioMutedRef.current = !audioEnabled;
  voiceStateRef.current = voiceState;

  const signal = signals[activeChannel];
  const isActive = signal?.active ?? false;

  // Load found channels from localStorage
  useEffect(() => {
    setFoundChannels(getFoundChannels());
  }, []);

  const isFound = signal && foundChannels.includes(signal.id);

  // Sync dark mode
  useEffect(() => {
    function sync() {
      isDarkRef.current = document.documentElement.dataset.theme === "dark";
    }
    sync();
    window.addEventListener("neko-settings-changed", sync);
    return () => window.removeEventListener("neko-settings-changed", sync);
  }, []);

  // Check reduced motion preference
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mql.matches;
    function onChange(e: MediaQueryListEvent) {
      reducedMotionRef.current = e.matches;
    }
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Create audio engine on mount (modal opened via click = valid user gesture)
  useEffect(() => {
    const engine = createAudioEngine();
    engine.ctx.resume();
    audioEngineRef.current = engine;
    updateAudio(
      engine,
      userFreqRef.current,
      userAmpRef.current,
      userHarmonicRef.current,
      userShapeRef.current,
      !audioEnabled || !signals[0]?.active,
    );
    return () => {
      destroyAudioEngine(engine);
      audioEngineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load voice buffer when channel changes
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!engine || !signal) return;

    // Stop any current voice playback
    stopVoice(engine);
    setVoiceState("idle");
    voiceLoadedRef.current = null;

    if (!isActive) return;

    const signalId = signal.id;
    let cancelled = false;

    loadVoiceBuffer(engine.ctx, signalId).then((buf) => {
      if (cancelled) return;
      // Guard against stale loads (Amy switched channels during fetch)
      if (!audioEngineRef.current || audioEngineRef.current !== engine) return;

      engine.voice.buffer = buf;
      voiceLoadedRef.current = buf ? signalId : null;

      // Start looped distorted playback if channel is active and unmatched
      if (buf && !foundChannels.includes(signalId)) {
        startVoiceLoop(engine);
        setVoiceState("tuning");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeChannel, signal, isActive, foundChannels]);

  // Update audio on slider, mute, or channel changes
  useEffect(() => {
    if (!audioEngineRef.current) return;
    const shouldMute = !audioEnabled || !isActive;
    let audioHarmonic = userHarmonic;
    let audioShape = userShape;
    if (signal && isCombination(signal)) {
      const w = comboPhase === 1 ? signal.wave1 : signal.wave2;
      audioHarmonic =
        w.harmonicTolerance !== undefined ? userHarmonic : w.targetHarmonic;
      audioShape = w.shapeTolerance !== undefined ? userShape : w.targetShape;
    }
    updateAudio(
      audioEngineRef.current,
      userFreq,
      userAmp,
      audioHarmonic,
      audioShape,
      shouldMute,
    );
  }, [
    userFreq,
    userAmp,
    userHarmonic,
    userShape,
    audioEnabled,
    isActive,
    signal,
    comboPhase,
  ]);

  // Sync voice/noise/clean gain with audioEnabled toggle
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!engine) return;
    const t = engine.ctx.currentTime;
    const tc = 0.05;
    engine.voice.voiceMaster.gain.setTargetAtTime(
      audioEnabled ? 1.0 : 0,
      t,
      tc,
    );
    // Mute/unmute noise (actual level managed by updateVoiceEffects)
    if (!audioEnabled) {
      engine.voice.noiseMaster.gain.setTargetAtTime(0, t, tc);
    }
    // Mute/unmute clean playback
    if (voiceState === "matched" || voiceState === "replaying") {
      engine.voice.cleanGain.gain.setTargetAtTime(
        audioEnabled ? 0.7 : 0,
        t,
        tc,
      );
    }
  }, [audioEnabled, voiceState]);

  // Chorus shimmer on matched/found channels — subtle detune for warmth
  useEffect(() => {
    const engine = audioEngineRef.current;
    if (!engine) return;
    const t = engine.ctx.currentTime;

    if (isFound || matched) {
      // Opposing detune on triangle pair creates a gentle chorus
      engine.osc1tri.detune.setTargetAtTime(3, t, 0.3);
      engine.osc2tri.detune.setTargetAtTime(-3, t, 0.3);
      // Slight detune on sine overtone adds width
      engine.osc2.detune.setTargetAtTime(2, t, 0.3);
      // Only adjust master gain when voice isn't actively transitioning/playing,
      // otherwise we'd override the dip and the oscillator bleeds through
      if (voiceState !== "matched" && voiceState !== "replaying") {
        engine.master.gain.setTargetAtTime(0.04, t, 0.3);
      }
    } else {
      // Reset to clean tuning state
      engine.osc1tri.detune.setTargetAtTime(0, t, 0.1);
      engine.osc2tri.detune.setTargetAtTime(0, t, 0.1);
      engine.osc2.detune.setTargetAtTime(0, t, 0.1);
      engine.master.gain.setTargetAtTime(0.06, t, 0.1);
    }
  }, [isFound, matched, voiceState]);

  // Keyboard controls: q/w = frequency, e/r = amplitude, t/y = harmonic, u/i = shape
  useEffect(() => {
    if (matched || !isActive) return;

    const comboWave =
      signal && isCombination(signal)
        ? comboPhase === 1
          ? signal.wave1
          : signal.wave2
        : null;
    const harmEnabled = !comboWave || comboWave.harmonicTolerance !== undefined;
    const shapeEnabled = !comboWave || comboWave.shapeTolerance !== undefined;
    const FREQ_STEP = 0.03;
    const AMP_STEP = 0.02;
    const HARM_STEP = 0.02;
    const SHAPE_STEP = 0.02;

    function onKeyDown(e: KeyboardEvent) {
      // Don't intercept if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key.toLowerCase()) {
        case "q":
          setUserFreq((v) => Math.max(0.3, v - FREQ_STEP));
          break;
        case "w":
          setUserFreq((v) => Math.min(4.0, v + FREQ_STEP));
          break;
        case "e":
          setUserAmp((v) => Math.max(0.1, v - AMP_STEP));
          break;
        case "r":
          setUserAmp((v) => Math.min(1.0, v + AMP_STEP));
          break;
        case "t":
          if (!harmEnabled) return;
          setUserHarmonic((v) => Math.max(0.0, v - HARM_STEP));
          break;
        case "y":
          if (!harmEnabled) return;
          setUserHarmonic((v) => Math.min(1.0, v + HARM_STEP));
          break;
        case "u":
          if (!shapeEnabled) return;
          setUserShape((v) => Math.max(0.0, v - SHAPE_STEP));
          break;
        case "i":
          if (!shapeEnabled) return;
          setUserShape((v) => Math.min(1.0, v + SHAPE_STEP));
          break;
        default:
          return;
      }
      e.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [matched, isActive, signal, comboPhase]);

  // Compute proximity
  const computeProximity = useCallback(() => {
    if (!signal) return 0;
    if (isCombination(signal)) {
      const w = comboPhase === 1 ? signal.wave1 : signal.wave2;
      const dists = [
        Math.abs(userFreq - w.targetFreq) / w.freqTolerance,
        Math.abs(userAmp - w.targetAmp) / w.ampTolerance,
      ];
      if (w.harmonicTolerance !== undefined)
        dists.push(
          Math.abs(userHarmonic - w.targetHarmonic) / w.harmonicTolerance,
        );
      if (w.shapeTolerance !== undefined)
        dists.push(Math.abs(userShape - w.targetShape) / w.shapeTolerance);
      return Math.max(0, 1 - Math.max(...dists) * 0.5);
    }
    const freqDist =
      Math.abs(userFreq - signal.targetFreq) / signal.freqTolerance;
    const ampDist = Math.abs(userAmp - signal.targetAmp) / signal.ampTolerance;
    const harmDist =
      Math.abs(userHarmonic - signal.targetHarmonic) / signal.harmonicTolerance;
    const shapeDist =
      Math.abs(userShape - signal.targetShape) / signal.shapeTolerance;
    const combinedDist = Math.max(freqDist, ampDist, harmDist, shapeDist);
    return Math.max(0, 1 - combinedDist * 0.5);
  }, [signal, userFreq, userAmp, userHarmonic, userShape, comboPhase]);

  const proximity = computeProximity();

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !signal) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    matchFramesRef.current = 0;
    setMatchFrames(0);
    setMatched(isFound);

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const channelActive = signal.active;
    const targetFreq = signal.targetFreq;
    const targetAmp = signal.targetAmp;
    const targetHarmonic = signal.targetHarmonic;
    const targetShape = signal.targetShape;

    function tick() {
      if (!canvas || !ctx || !signal) return;

      if (reducedMotionRef.current) return;

      timeRef.current += 0.02;

      // Update garble tick (~3 shifts per second)
      const newGarbleTick = Math.floor(timeRef.current * 3);
      if (newGarbleTick !== garbleTickRef.current) {
        garbleTickRef.current = newGarbleTick;
        setGarbleTick(newGarbleTick);

        // Update reveal progress (piggyback on garble tick)
        if (revealStartRef.current !== null) {
          const elapsed = performance.now() - revealStartRef.current;
          const p = Math.min(elapsed / 7000, 1);
          setRevealProgress(p);
          if (p >= 1) revealStartRef.current = null;
        }
      }

      // Locked channels: just draw dark background with heavy noise
      if (!channelActive) {
        drawCanvas(ctx, canvas.width, canvas.height, {
          targetFreq: signal.targetFreq,
          targetAmp: 0,
          targetHarmonic: 0,
          targetShape: 0,
          userFreq: 1,
          userAmp: 0,
          userHarmonic: 0,
          userShape: 0,
          proximity: 0,
          time: timeRef.current,
          isDark: isDarkRef.current,
        });
        animRef.current = requestAnimationFrame(tick);
        return;
      }

      const freq = userFreqRef.current;
      const amp = userAmpRef.current;
      const harm = userHarmonicRef.current;
      const shape = userShapeRef.current;

      // Ensure AudioContext is running (may be suspended after Strict Mode re-mount)
      const engine = audioEngineRef.current;
      if (engine) ensureContextRunning(engine.ctx);

      const combo = isCombination(signal);

      // Update voice effects + schedule fragments each frame
      if (engine && voiceStateRef.current === "tuning") {
        let voiceProx: number;
        if (combo) {
          const w = comboPhaseRef.current === 1 ? signal.wave1 : signal.wave2;
          const vDists = [
            Math.abs(freq - w.targetFreq) / w.freqTolerance,
            Math.abs(amp - w.targetAmp) / w.ampTolerance,
          ];
          if (w.harmonicTolerance !== undefined)
            vDists.push(
              Math.abs(harm - w.targetHarmonic) / w.harmonicTolerance,
            );
          if (w.shapeTolerance !== undefined)
            vDists.push(Math.abs(shape - w.targetShape) / w.shapeTolerance);
          voiceProx = Math.max(0, 1 - Math.max(...vDists) * 0.5);
        } else {
          const voiceFreqDist =
            Math.abs(freq - targetFreq) / signal.freqTolerance;
          const voiceAmpDist = Math.abs(amp - targetAmp) / signal.ampTolerance;
          const voiceHarmDist =
            Math.abs(harm - targetHarmonic) / signal.harmonicTolerance;
          const voiceShapeDist =
            Math.abs(shape - targetShape) / signal.shapeTolerance;
          voiceProx = Math.max(
            0,
            1 -
              Math.max(
                voiceFreqDist,
                voiceAmpDist,
                voiceHarmDist,
                voiceShapeDist,
              ) *
                0.5,
          );
        }

        const freqOff = Math.abs(freq - targetFreq) / 3.7;
        const ampOff = Math.abs(amp - targetAmp) / 0.9;
        const harmOff = Math.abs(harm - targetHarmonic) / 1.0;

        updateVoiceEffects(
          engine,
          freqOff,
          ampOff,
          harmOff,
          audioMutedRef.current,
          voiceProx,
        );
        scheduleFragments(engine, voiceProx);
      }

      // Match detection
      if (combo) {
        // Combination mode — two-phase matching
        const phase = comboPhaseRef.current;
        const w = phase === 1 ? signal.wave1 : signal.wave2;
        let withinTol =
          Math.abs(freq - w.targetFreq) <= w.freqTolerance &&
          Math.abs(amp - w.targetAmp) <= w.ampTolerance;
        if (w.harmonicTolerance !== undefined)
          withinTol =
            withinTol &&
            Math.abs(harm - w.targetHarmonic) <= w.harmonicTolerance;
        if (w.shapeTolerance !== undefined)
          withinTol =
            withinTol && Math.abs(shape - w.targetShape) <= w.shapeTolerance;

        if (withinTol && !isFound) {
          matchFramesRef.current++;
          if (matchFramesRef.current >= MATCH_FRAMES_REQUIRED) {
            if (phase === 1) {
              // Lock wave 1, transition to phase 2
              const w1 = signal.wave1;
              const locked = {
                freq,
                amp,
                harmonic:
                  w1.harmonicTolerance !== undefined ? harm : w1.targetHarmonic,
                shape: w1.shapeTolerance !== undefined ? shape : w1.targetShape,
              };
              lockedWave1Ref.current = locked;
              comboPhaseRef.current = 2;
              setLockedWave1(locked);
              setComboPhase(2);
              setUserFreq(1.0);
              setUserAmp(0.5);
              setUserHarmonic(0.0);
              setUserShape(0.0);
              userFreqRef.current = 1.0;
              userAmpRef.current = 0.5;
              userHarmonicRef.current = 0.0;
              userShapeRef.current = 0.0;
              matchFramesRef.current = 0;
            } else {
              // Phase 2 complete — full match
              saveFoundChannel(signal.id);
              reportSignalSolved(signal.id);
              setFoundChannels(getFoundChannels());
              setMatched(true);
              revealStartRef.current = performance.now();
              if (engine) {
                transitionToCleanPlayback(engine, () => {
                  setVoiceState("revealed");
                });
                setVoiceState("matched");
              }
            }
          }
        } else if (!isFound) {
          matchFramesRef.current = Math.max(0, matchFramesRef.current - 2);
        }
      } else {
        // Single mode — all four must be within tolerance
        const withinTol =
          Math.abs(freq - signal.targetFreq) <= signal.freqTolerance &&
          Math.abs(amp - signal.targetAmp) <= signal.ampTolerance &&
          Math.abs(harm - signal.targetHarmonic) <= signal.harmonicTolerance &&
          Math.abs(shape - signal.targetShape) <= signal.shapeTolerance;

        if (withinTol && !isFound) {
          matchFramesRef.current++;
          if (matchFramesRef.current >= MATCH_FRAMES_REQUIRED) {
            saveFoundChannel(signal.id);
            reportSignalSolved(signal.id);
            setFoundChannels(getFoundChannels());
            setMatched(true);
            revealStartRef.current = performance.now();
            if (engine) {
              transitionToCleanPlayback(engine, () => {
                setVoiceState("revealed");
              });
              setVoiceState("matched");
            }
          }
        } else if (!isFound) {
          matchFramesRef.current = Math.max(0, matchFramesRef.current - 2);
        }
      }

      if (
        matchFramesRef.current % 10 === 0 ||
        matchFramesRef.current >= MATCH_FRAMES_REQUIRED
      ) {
        setMatchFrames(matchFramesRef.current);
      }

      // Compute proximity for draw
      let prox: number;
      if (combo) {
        const w = comboPhaseRef.current === 1 ? signal.wave1 : signal.wave2;
        const pDists = [
          Math.abs(freq - w.targetFreq) / w.freqTolerance,
          Math.abs(amp - w.targetAmp) / w.ampTolerance,
        ];
        if (w.harmonicTolerance !== undefined)
          pDists.push(Math.abs(harm - w.targetHarmonic) / w.harmonicTolerance);
        if (w.shapeTolerance !== undefined)
          pDists.push(Math.abs(shape - w.targetShape) / w.shapeTolerance);
        prox = Math.max(0, 1 - Math.max(...pDists) * 0.5);
      } else {
        const freqDist =
          Math.abs(freq - signal.targetFreq) / signal.freqTolerance;
        const ampDist = Math.abs(amp - signal.targetAmp) / signal.ampTolerance;
        const harmDist =
          Math.abs(harm - signal.targetHarmonic) / signal.harmonicTolerance;
        const shapeDist =
          Math.abs(shape - signal.targetShape) / signal.shapeTolerance;
        prox = Math.max(
          0,
          1 - Math.max(freqDist, ampDist, harmDist, shapeDist) * 0.5,
        );
      }

      drawCanvas(ctx, canvas.width, canvas.height, {
        targetFreq: signal.targetFreq,
        targetAmp: signal.targetAmp,
        targetHarmonic: signal.targetHarmonic,
        targetShape: signal.targetShape,
        userFreq: freq,
        userAmp: amp,
        userHarmonic: harm,
        userShape: shape,
        proximity: isFound ? 1 : prox,
        time: timeRef.current,
        isDark: isDarkRef.current,
        comboPhase: combo ? comboPhaseRef.current : undefined,
        wave1Target: combo ? signal.wave1 : undefined,
        wave2Target: combo ? signal.wave2 : undefined,
        lockedWave1: combo ? lockedWave1Ref.current : undefined,
      });

      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
    };
  }, [signal, isFound, activeChannel]);

  // Static frame for reduced motion
  useEffect(() => {
    if (!reducedMotionRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas || !signal) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const combo = isCombination(signal);
    drawCanvas(ctx, canvas.width, canvas.height, {
      targetFreq: signal.targetFreq,
      targetAmp: signal.targetAmp,
      targetHarmonic: signal.targetHarmonic,
      targetShape: signal.targetShape,
      userFreq,
      userAmp,
      userHarmonic,
      userShape,
      proximity: isFound ? 1 : proximity,
      time: 0,
      isDark: isDarkRef.current,
      comboPhase: combo ? comboPhase : undefined,
      wave1Target: combo ? signal.wave1 : undefined,
      wave2Target: combo ? signal.wave2 : undefined,
      lockedWave1: combo ? lockedWave1 : undefined,
    });
  }, [
    signal,
    userFreq,
    userAmp,
    userHarmonic,
    userShape,
    isFound,
    proximity,
    comboPhase,
    lockedWave1,
  ]);

  // Reset Amy's params when switching channels
  useEffect(() => {
    if (signal && foundChannels.includes(signal.id)) {
      if (isCombination(signal)) {
        // Found combo: show combined resolved state
        setLockedWave1({
          freq: signal.wave1.targetFreq,
          amp: signal.wave1.targetAmp,
          harmonic: signal.wave1.targetHarmonic,
          shape: signal.wave1.targetShape,
        });
        setComboPhase(2);
        setUserFreq(signal.wave2.targetFreq);
        setUserAmp(signal.wave2.targetAmp);
        setUserHarmonic(
          signal.wave2.harmonicTolerance !== undefined
            ? signal.wave2.targetHarmonic
            : 0,
        );
        setUserShape(
          signal.wave2.shapeTolerance !== undefined
            ? signal.wave2.targetShape
            : 0,
        );
      } else {
        setUserFreq(signal.targetFreq);
        setUserAmp(signal.targetAmp);
        setUserHarmonic(signal.targetHarmonic);
        setUserShape(signal.targetShape);
      }
      setMatched(true);
      // Don't clobber an in-progress reveal animation
      if (revealStartRef.current === null) {
        setRevealProgress(1);
      }
    } else {
      setUserFreq(1.0);
      setUserAmp(0.5);
      setUserHarmonic(0.0);
      setUserShape(0.0);
      setMatched(false);
      setRevealProgress(0);
      revealStartRef.current = null;
      setComboPhase(1);
      setLockedWave1(null);
    }
    matchFramesRef.current = 0;
    setMatchFrames(0);
  }, [activeChannel, signal, foundChannels]);

  function handleReplay() {
    const engine = audioEngineRef.current;
    if (!engine || !engine.voice.buffer) return;

    // Ensure clean gain respects mute state
    const t = engine.ctx.currentTime;
    engine.voice.cleanGain.gain.cancelScheduledValues(t);
    engine.voice.cleanGain.gain.setValueAtTime(audioEnabled ? 0.7 : 0, t);

    playCleanVoice(engine, () => {
      setVoiceState("revealed");
    });
    setVoiceState("replaying");
  }

  function resetAllChannels() {
    const engine = audioEngineRef.current;
    if (engine) {
      stopVoice(engine);
      engine.voice.cleanGain.gain.value = 0;
    }
    localStorage.removeItem(STORAGE_KEY);
    setFoundChannels([]);
    setConfirmReset(false);
    setActiveChannel(0);
    setVoiceState("idle");
    setComboPhase(1);
    setLockedWave1(null);
  }

  if (!signal) return null;

  const matchProgress = Math.min(matchFrames / MATCH_FRAMES_REQUIRED, 1);
  const canReplay =
    revealProgress >= 1 &&
    voiceLoadedRef.current === signal.id &&
    voiceState !== "replaying" &&
    voiceState !== "matched";

  return (
    <div className={styles.content}>
      {/* Channel selector */}
      <div
        className={styles.channels}
        role="tablist"
        aria-label="Signal channels"
      >
        {signals.map((s, i) => {
          const chFound = foundChannels.includes(s.id);
          const chSelected = i === activeChannel;
          const chLocked = !s.active;
          const classes = [
            styles.channelBtn,
            chFound && styles.found,
            chSelected && styles.active,
            chLocked && styles.locked,
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={s.id}
              className={classes}
              onClick={() => setActiveChannel(i)}
              role="tab"
              aria-selected={chSelected}
              aria-label={
                chFound
                  ? s.title
                  : chLocked
                    ? `Locked until ${formatDate(s.releaseDate)}`
                    : `Channel ${i + 1}`
              }
              type="button"
            >
              <span className={styles.channelDot} />
              <span className={styles.channelLabel}>
                {chFound ? s.title : formatDate(s.releaseDate)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Canvas */}
      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label={
            !isActive
              ? `Signal locked until ${formatDate(signal.releaseDate)}`
              : matched
                ? "Signal received."
                : "Adjust frequency, amplitude, harmonic, and shape to match the hidden signal."
          }
        />
        {/* Audio toggle — only when active */}
        {isActive && (
          <button
            className={`${styles.audioBtn} ${audioEnabled ? styles.audioBtnOn : ""}`}
            onClick={toggleAudioEnabled}
            type="button"
            aria-label={
              audioEnabled ? "Mute signal audio" : "Unmute signal audio"
            }
            title={audioEnabled ? "Mute audio" : "Play audio"}
          >
            {!audioEnabled ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
        )}
        {/* Locked overlay */}
        {!isActive && (
          <div className={styles.lockedOverlay}>
            <p className={styles.lockedMessage}>
              signal begins broadcasting on {formatFullDate(signal.releaseDate)}{" "}
              EST
            </p>
          </div>
        )}
      </div>

      {/* Controls — only when active and not yet matched */}
      {isActive && !matched && (
        <>
          <div className={styles.controls}>
            <Dial
              id="signal-freq"
              label="frequency"
              value={userFreq}
              min={0.3}
              max={4.0}
              step={0.01}
              onChange={setUserFreq}
              keys={["q", "w"]}
            />
            <Dial
              id="signal-amp"
              label="amplitude"
              value={userAmp}
              min={0.1}
              max={1.0}
              step={0.01}
              onChange={setUserAmp}
              keys={["e", "r"]}
            />
            {(() => {
              const cw = isCombination(signal)
                ? comboPhase === 1
                  ? signal.wave1
                  : signal.wave2
                : null;
              const showHarm = !cw || cw.harmonicTolerance !== undefined;
              const showShape = !cw || cw.shapeTolerance !== undefined;
              return (
                <>
                  {showHarm && (
                    <Dial
                      id="signal-harm"
                      label="harmonic"
                      value={userHarmonic}
                      min={0.0}
                      max={1.0}
                      step={0.01}
                      onChange={setUserHarmonic}
                      keys={["t", "y"]}
                    />
                  )}
                  {showShape && (
                    <Dial
                      id="signal-shape"
                      label="shape"
                      value={userShape}
                      min={0.0}
                      max={1.0}
                      step={0.01}
                      onChange={setUserShape}
                      keys={["u", "i"]}
                    />
                  )}
                </>
              );
            })()}
          </div>

          {/* Phase indicator for combination mode */}
          {isCombination(signal) && (
            <div className={styles.phaseIndicator}>
              <span
                className={`${styles.phaseDot} ${lockedWave1 ? styles.phaseLocked : styles.phaseActive}`}
              />
              <span
                className={`${styles.phaseDot} ${comboPhase === 2 ? styles.phaseActive : styles.phasePending}`}
              />
            </div>
          )}

          {/* Proximity bar */}
          <div className={styles.proximityWrap}>
            <div
              className={styles.proximityFill}
              style={{
                width: `${Math.max(proximity * 100, matchProgress * 100)}%`,
              }}
            />
          </div>
        </>
      )}

      {/* Poem + received label (side by side when matched) */}
      {isActive && (
        <div
          className={`${styles.postCanvas} ${matched ? styles.postCanvasMatched : ""}`}
        >
          <div className={styles.poemArea}>
            <p
              className={`${styles.revealedText} ${revealProgress < 1 ? styles.garbled : ""}`}
              style={
                revealProgress < 1
                  ? { opacity: 0.35 + revealProgress * 0.65 }
                  : undefined
              }
            >
              {revealProgress >= 1
                ? signal.text
                : garbleText(
                    signal.text,
                    signal.id,
                    garbleTick,
                    revealProgress,
                  )}
            </p>
          </div>
          {matched && (
            <div className={styles.receivedRow}>
              <p className={styles.receivedLabel}>signal received</p>
              <div className={styles.receivedControls}>
                {canReplay && (
                  <button
                    className={styles.replayBtn}
                    onClick={handleReplay}
                    type="button"
                    aria-label="Replay voice recording"
                    title="Replay"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      stroke="none"
                    >
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  </button>
                )}
                {voiceState === "replaying" && (
                  <span className={styles.replayingDot} />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reset progress */}
      {foundChannels.length > 0 && (
        <div className={styles.resetArea}>
          {!confirmReset ? (
            <button
              className={styles.resetBtn}
              onClick={() => setConfirmReset(true)}
              type="button"
            >
              reset all signals
            </button>
          ) : (
            <div className={styles.resetConfirm}>
              <p className={styles.resetMessage}>
                do you really like solving these that much?
              </p>
              <div className={styles.resetActions}>
                <button
                  className={styles.resetConfirmBtn}
                  onClick={resetAllChannels}
                  type="button"
                >
                  yes
                </button>
                <button
                  className={styles.resetCancelBtn}
                  onClick={() => setConfirmReset(false)}
                  type="button"
                >
                  no
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
