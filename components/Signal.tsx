"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { Signal } from "@/data/signals";
import { useAudioEnabled } from "@/hooks/useAudioEnabled";
import styles from "./Signal.module.css";

const STORAGE_KEY = "signal-found-channels";
const MATCH_FRAMES_REQUIRED = 60;

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

/* ========================================
   Card Face — small SVG waveform on table
   ======================================== */

export function SignalCardFace() {
  // Generate a simple sine wave path
  const points: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const x = i;
    const y = 16 + Math.sin((i / 64) * Math.PI * 4) * 10;
    points.push(`${i === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
  }
  const d = points.join(" ");

  return (
    <div className={styles.face}>
      <svg className={styles.faceSvg} viewBox="0 0 64 32" aria-hidden="true">
        <path className={styles.faceWave} d={d} />
      </svg>
      <div className={styles.faceScanline} />
    </div>
  );
}

/* ========================================
   Audio Engine (Web Audio API)
   ======================================== */

interface AudioEngine {
  ctx: AudioContext;
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  gain1: GainNode;
  gain2: GainNode;
  master: GainNode;
}

function createAudioEngine(): AudioEngine {
  const ctx = new AudioContext();
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();
  const master = ctx.createGain();

  osc1.type = "sine";
  osc2.type = "sine";

  osc1.connect(gain1).connect(master);
  osc2.connect(gain2).connect(master);
  master.connect(ctx.destination);

  master.gain.value = 0.12;
  gain1.gain.value = 0;
  gain2.gain.value = 0;

  osc1.start();
  osc2.start();

  return { ctx, osc1, osc2, gain1, gain2, master };
}

function updateAudio(
  engine: AudioEngine,
  freq: number,
  amp: number,
  harmonic: number,
  muted: boolean,
) {
  const t = engine.ctx.currentTime;
  const audioFreq = 80 + freq * 120;
  const volume = muted ? 0 : amp;

  engine.osc1.frequency.setTargetAtTime(audioFreq, t, 0.02);
  engine.osc2.frequency.setTargetAtTime(audioFreq * 2, t, 0.02);

  // Fundamental gets quieter as harmonic increases; overtone gets louder
  const fundVol = volume * (1 - harmonic * 0.4);
  const harmVol = volume * harmonic * 0.6;
  engine.gain1.gain.setTargetAtTime(fundVol, t, 0.02);
  engine.gain2.gain.setTargetAtTime(harmVol, t, 0.02);
}

function destroyAudioEngine(engine: AudioEngine) {
  engine.osc1.stop();
  engine.osc2.stop();
  engine.ctx.close();
}

/* ========================================
   Canvas Drawing
   ======================================== */

interface DrawParams {
  targetFreq: number;
  targetAmp: number;
  targetHarmonic: number;
  userFreq: number;
  userAmp: number;
  userHarmonic: number;
  proximity: number;
  time: number;
  isDark: boolean;
}

function waveY(
  x: number,
  freq: number,
  amp: number,
  harmonic: number,
  midY: number,
  ampScale: number,
  time: number,
) {
  const fundamental = Math.sin(2 * Math.PI * freq * x * 4 + time);
  const overtone = Math.sin(2 * Math.PI * freq * 2 * x * 4 + time);
  const blended =
    fundamental * (1 - harmonic * 0.4) + overtone * harmonic * 0.6;
  return midY + blended * amp * ampScale;
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
    userFreq,
    userAmp,
    userHarmonic,
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

  // Draw wave helper
  function drawWave(
    freq: number,
    amp: number,
    harmonic: number,
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
      const y = waveY(x, freq, amp, harmonic, midY, ampScale, time);
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Target wave (gold)
  const goldColor = isDark ? "#d4b878" : "#c4a265";
  const targetAlpha = 0.15 + proximity * 0.85;
  const targetGlow = isDark ? proximity * 1.3 : proximity;
  drawWave(
    targetFreq,
    targetAmp,
    targetHarmonic,
    goldColor,
    targetAlpha,
    targetGlow,
  );

  // User wave (green)
  const greenColor = isDark ? "#4a8b6b" : "#3a6b5b";
  drawWave(
    userFreq,
    userAmp,
    userHarmonic,
    greenColor,
    0.9,
    isDark ? 0.6 : 0.3,
  );

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
   Signal Content — Modal
   ======================================== */

interface SignalContentProps {
  signals: Signal[];
}

export function SignalContent({ signals }: SignalContentProps) {
  const [activeChannel, setActiveChannel] = useState(0);
  const [foundChannels, setFoundChannels] = useState<string[]>([]);
  const [userFreq, setUserFreq] = useState(1.0);
  const [userAmp, setUserAmp] = useState(0.5);
  const [userHarmonic, setUserHarmonic] = useState(0.0);
  const [matchFrames, setMatchFrames] = useState(0);
  const [matched, setMatched] = useState(false);
  const [audioEnabled, toggleAudioEnabled] = useAudioEnabled();
  const [garbleTick, setGarbleTick] = useState(0);
  const [revealProgress, setRevealProgress] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const matchFramesRef = useRef(0);
  const isDarkRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const userFreqRef = useRef(userFreq);
  const userAmpRef = useRef(userAmp);
  const userHarmonicRef = useRef(userHarmonic);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const audioMutedRef = useRef(!audioEnabled);
  const garbleTickRef = useRef(0);
  const revealStartRef = useRef<number | null>(null);
  userFreqRef.current = userFreq;
  userAmpRef.current = userAmp;
  userHarmonicRef.current = userHarmonic;
  audioMutedRef.current = !audioEnabled;

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
      !audioEnabled || !signals[0]?.active,
    );
    return () => {
      destroyAudioEngine(engine);
      audioEngineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update audio on slider, mute, or channel changes
  useEffect(() => {
    if (!audioEngineRef.current) return;
    const shouldMute = !audioEnabled || !isActive;
    updateAudio(
      audioEngineRef.current,
      userFreq,
      userAmp,
      userHarmonic,
      shouldMute,
    );
  }, [userFreq, userAmp, userHarmonic, audioEnabled, isActive]);

  // Keyboard controls: q/e = frequency, a/d = amplitude, w/s = harmonic
  useEffect(() => {
    if (matched || !isActive) return;

    const FREQ_STEP = 0.03;
    const AMP_STEP = 0.02;
    const HARM_STEP = 0.02;

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
        case "e":
          setUserFreq((v) => Math.min(4.0, v + FREQ_STEP));
          break;
        case "a":
          setUserAmp((v) => Math.max(0.1, v - AMP_STEP));
          break;
        case "d":
          setUserAmp((v) => Math.min(1.0, v + AMP_STEP));
          break;
        case "w":
          setUserHarmonic((v) => Math.min(1.0, v + HARM_STEP));
          break;
        case "s":
          setUserHarmonic((v) => Math.max(0.0, v - HARM_STEP));
          break;
        default:
          return;
      }
      e.preventDefault();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [matched, isActive]);

  // Compute proximity
  const computeProximity = useCallback(() => {
    if (!signal) return 0;
    const freqDist =
      Math.abs(userFreq - signal.targetFreq) / signal.freqTolerance;
    const ampDist = Math.abs(userAmp - signal.targetAmp) / signal.ampTolerance;
    const harmDist =
      Math.abs(userHarmonic - signal.targetHarmonic) / signal.harmonicTolerance;
    const combinedDist = Math.max(freqDist, ampDist, harmDist);
    return Math.max(0, 1 - combinedDist * 0.5);
  }, [signal, userFreq, userAmp, userHarmonic]);

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
          userFreq: 1,
          userAmp: 0,
          userHarmonic: 0,
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

      // Match detection — all three must be within tolerance
      const withinTol =
        Math.abs(freq - signal.targetFreq) <= signal.freqTolerance &&
        Math.abs(amp - signal.targetAmp) <= signal.ampTolerance &&
        Math.abs(harm - signal.targetHarmonic) <= signal.harmonicTolerance;

      if (withinTol && !isFound) {
        matchFramesRef.current++;
        if (matchFramesRef.current >= MATCH_FRAMES_REQUIRED) {
          saveFoundChannel(signal.id);
          setFoundChannels(getFoundChannels());
          setMatched(true);
          revealStartRef.current = performance.now();
        }
      } else if (!isFound) {
        matchFramesRef.current = Math.max(0, matchFramesRef.current - 2);
      }
      if (
        matchFramesRef.current % 10 === 0 ||
        matchFramesRef.current >= MATCH_FRAMES_REQUIRED
      ) {
        setMatchFrames(matchFramesRef.current);
      }

      // Compute proximity for draw
      const freqDist =
        Math.abs(freq - signal.targetFreq) / signal.freqTolerance;
      const ampDist = Math.abs(amp - signal.targetAmp) / signal.ampTolerance;
      const harmDist =
        Math.abs(harm - signal.targetHarmonic) / signal.harmonicTolerance;
      const combinedDist = Math.max(freqDist, ampDist, harmDist);
      const prox = Math.max(0, 1 - combinedDist * 0.5);

      drawCanvas(ctx, canvas.width, canvas.height, {
        targetFreq: signal.targetFreq,
        targetAmp: signal.targetAmp,
        targetHarmonic: signal.targetHarmonic,
        userFreq: freq,
        userAmp: amp,
        userHarmonic: harm,
        proximity: isFound ? 1 : prox,
        time: timeRef.current,
        isDark: isDarkRef.current,
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

    drawCanvas(ctx, canvas.width, canvas.height, {
      targetFreq: signal.targetFreq,
      targetAmp: signal.targetAmp,
      targetHarmonic: signal.targetHarmonic,
      userFreq,
      userAmp,
      userHarmonic,
      proximity: isFound ? 1 : proximity,
      time: 0,
      isDark: isDarkRef.current,
    });
  }, [signal, userFreq, userAmp, userHarmonic, isFound, proximity]);

  // Reset user params when switching channels
  useEffect(() => {
    if (signal && foundChannels.includes(signal.id)) {
      setUserFreq(signal.targetFreq);
      setUserAmp(signal.targetAmp);
      setUserHarmonic(signal.targetHarmonic);
      setMatched(true);
      // Don't clobber an in-progress reveal animation
      if (revealStartRef.current === null) {
        setRevealProgress(1);
      }
    } else {
      setUserFreq(1.0);
      setUserAmp(0.5);
      setUserHarmonic(0.0);
      setMatched(false);
      setRevealProgress(0);
      revealStartRef.current = null;
    }
    matchFramesRef.current = 0;
    setMatchFrames(0);
  }, [activeChannel, signal, foundChannels]);

  function resetAllChannels() {
    localStorage.removeItem(STORAGE_KEY);
    setFoundChannels([]);
    setConfirmReset(false);
    setActiveChannel(0);
  }

  if (!signal) return null;

  const matchProgress = Math.min(matchFrames / MATCH_FRAMES_REQUIRED, 1);

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
                : "Adjust frequency, amplitude, and harmonic to match the hidden signal."
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
            <div className={styles.sliderGroup}>
              <label className={styles.sliderLabel} htmlFor="signal-freq">
                <span className={styles.keyHint}>
                  <span className={styles.keyArrow}>&larr;</span>{" "}
                  <span className={styles.key}>q</span>
                </span>
                frequency
                <span className={styles.keyHint}>
                  <span className={styles.key}>e</span>{" "}
                  <span className={styles.keyArrow}>&rarr;</span>
                </span>
              </label>
              <input
                id="signal-freq"
                className={styles.slider}
                type="range"
                min="0.3"
                max="4.0"
                step="0.01"
                value={userFreq}
                onChange={(e) => setUserFreq(parseFloat(e.target.value))}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label className={styles.sliderLabel} htmlFor="signal-amp">
                <span className={styles.keyHint}>
                  <span className={styles.keyArrow}>&larr;</span>{" "}
                  <span className={styles.key}>a</span>
                </span>
                amplitude
                <span className={styles.keyHint}>
                  <span className={styles.key}>d</span>{" "}
                  <span className={styles.keyArrow}>&rarr;</span>
                </span>
              </label>
              <input
                id="signal-amp"
                className={styles.slider}
                type="range"
                min="0.1"
                max="1.0"
                step="0.01"
                value={userAmp}
                onChange={(e) => setUserAmp(parseFloat(e.target.value))}
              />
            </div>
            <div className={styles.sliderGroup}>
              <label className={styles.sliderLabel} htmlFor="signal-harm">
                <span className={styles.keyHint}>
                  <span className={styles.keyArrow}>&larr;</span>{" "}
                  <span className={styles.key}>s</span>
                </span>
                harmonic
                <span className={styles.keyHint}>
                  <span className={styles.key}>w</span>{" "}
                  <span className={styles.keyArrow}>&rarr;</span>
                </span>
              </label>
              <input
                id="signal-harm"
                className={styles.slider}
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={userHarmonic}
                onChange={(e) => setUserHarmonic(parseFloat(e.target.value))}
              />
            </div>
          </div>

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

      {/* Received label */}
      {isActive && matched && (
        <p className={styles.receivedLabel}>signal received</p>
      )}

      {/* Poem text */}
      {isActive && (
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
              : garbleText(signal.text, signal.id, garbleTick, revealProgress)}
          </p>
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
