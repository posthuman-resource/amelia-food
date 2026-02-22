"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./TransmissionNote.module.css";

interface Transmission {
  id: string;
  text: string;
  createdAt: string;
}

/* ========================================
   waveY — copied from Signal.tsx
   ======================================== */
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

/* ========================================
   TransmissionDemo — Looping oscilloscope
   Shows each dial being adjusted one at a time
   ======================================== */
const CYCLE_DURATION = 14; // seconds

// Target waveform (gold) — higher freq so more ridges visible
const TARGET = { freq: 1.2, amp: 0.65, harmonic: 0.35, shape: 0.15 };
// Starting "wrong" position — very different from target
const START = { freq: 0.4, amp: 0.3, harmonic: 0.8, shape: 0.7 };

// Timeline: pause → dial1 → pause → dial2 → pause → dial3 → pause → dial4 → matched → fade
// Each dial adjusts one param while others stay still
const PHASE_PAUSE_0 = 0.6;
const PHASE_DIAL = 2.0; // each dial turn duration
const PHASE_GAP = 0.3; // pause between dials
const PHASE_MATCHED = 1.8;
const PHASE_FADE = 0.8;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Returns { dialProgress: [0-1, 0-1, 0-1, 0-1], activeDial: 0|1|2|3|-1 }
function getDialState(cycleTime: number) {
  let t = cycleTime;
  const p = [0, 0, 0, 0];
  let active = -1;

  // Initial pause
  if (t < PHASE_PAUSE_0) return { dialProgress: p, activeDial: active };
  t -= PHASE_PAUSE_0;

  // 4 dials, each with a turn phase + gap
  for (let d = 0; d < 4; d++) {
    if (t < PHASE_DIAL) {
      p[d] = easeInOut(t / PHASE_DIAL);
      return { dialProgress: p, activeDial: d };
    }
    p[d] = 1;
    t -= PHASE_DIAL;

    if (d < 3) {
      if (t < PHASE_GAP) return { dialProgress: p, activeDial: -1 };
      t -= PHASE_GAP;
    }
  }

  // Matched or fade
  return { dialProgress: p, activeDial: -1 };
}

function TransmissionDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const draw = useCallback((timestamp: number) => {
    if (!startTimeRef.current) startTimeRef.current = timestamp;
    const elapsed = (timestamp - startTimeRef.current) / 1000;
    const cycleTime = elapsed % CYCLE_DURATION;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (
      canvas.width !== rect.width * dpr ||
      canvas.height !== rect.height * dpr
    ) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;

    const { dialProgress, activeDial } = getDialState(cycleTime);
    const [p0, p1, p2, p3] = dialProgress;

    // Each dial controls one wave parameter
    const userFreq = lerp(START.freq, TARGET.freq, p0);
    const userAmp = lerp(START.amp, TARGET.amp, p1);
    const userHarmonic = lerp(START.harmonic, TARGET.harmonic, p2);
    const userShape = lerp(START.shape, TARGET.shape, p3);

    // Overall proximity (average of all four)
    const overallProgress = (p0 + p1 + p2 + p3) / 4;

    // Fade for reset
    const fadeStart = CYCLE_DURATION - PHASE_FADE;
    let globalAlpha = 1;
    if (cycleTime > fadeStart) {
      globalAlpha = Math.max(0, 1 - (cycleTime - fadeStart) / PHASE_FADE);
    }
    if (cycleTime < 0.3) {
      globalAlpha = cycleTime / 0.3;
    }

    const time = elapsed * 0.8;
    const midY = height / 2;
    const ampScale = height * 0.35;

    const goldColor = "#c4a265";
    const greenColor = "#3a6b5b";
    const activeGlow = "#c4a265";

    // Background
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1a1612";
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 6]);
    for (let i = 1; i < 12; i++) {
      const x = (width / 12) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let i = 1; i < 6; i++) {
      const y = (height / 6) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Center line
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(width, midY);
    ctx.stroke();

    ctx.globalAlpha = globalAlpha;

    // Target wave (gold)
    const targetAlpha = 0.15 + overallProgress * 0.85;
    ctx.save();
    ctx.globalAlpha = globalAlpha * targetAlpha;
    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 2;
    if (overallProgress > 0.5) {
      ctx.shadowColor = goldColor;
      ctx.shadowBlur = 8 * overallProgress;
    }
    ctx.beginPath();
    for (let px = 0; px < width; px++) {
      const x = px / width;
      const y = waveY(
        x,
        TARGET.freq,
        TARGET.amp,
        TARGET.harmonic,
        TARGET.shape,
        midY,
        ampScale,
        time,
      );
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.restore();

    // User wave (green)
    ctx.save();
    ctx.globalAlpha = globalAlpha * 0.9;
    ctx.strokeStyle = greenColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = greenColor;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (let px = 0; px < width; px++) {
      const x = px / width;
      const y = waveY(
        x,
        userFreq,
        userAmp,
        userHarmonic,
        userShape,
        midY,
        ampScale,
        time,
      );
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
    ctx.restore();

    // Noise (inverse of overall progress)
    const noiseAlpha = (1 - overallProgress) * 0.6;
    if (noiseAlpha > 0.01) {
      ctx.fillStyle = `rgba(255,255,255,${noiseAlpha * 0.4})`;
      const noiseCount = Math.floor((1 - overallProgress) * 80);
      for (let i = 0; i < noiseCount; i++) {
        const nx =
          ((Math.sin(i * 127.1 + time * 3) * 0.5 + 0.5) * width) % width;
        const ny =
          ((Math.cos(i * 269.5 + time * 2) * 0.5 + 0.5) * height) % height;
        ctx.fillRect(nx, ny, 1.5, 1.5);
      }
    }

    // Proximity bar at bottom
    const barHeight = 3;
    const barY = height - barHeight - 4;
    const barWidth = width * 0.6;
    const barX = (width - barWidth) / 2;

    ctx.globalAlpha = globalAlpha * 0.4;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    ctx.globalAlpha = globalAlpha * 0.8;
    const allDone = p0 === 1 && p1 === 1 && p2 === 1 && p3 === 1;
    ctx.fillStyle = allDone ? goldColor : greenColor;
    ctx.fillRect(barX, barY, barWidth * overallProgress, barHeight);

    // Four dials — each one lights up when it's being adjusted
    const dialY = 14;
    const dialRadius = 8;
    const dialSpacing = 28;
    const dialCenterX = width / 2;
    const dialStartX = dialCenterX - 1.5 * dialSpacing;

    // Start and end angles are arbitrary — end positions are NOT uniform
    // so she sees the dials land in different spots (it's about the wave, not the dial)
    const startAngles = [0.8, 2.1, 3.5, 1.2];
    const endAngles = [2.4, -0.7, 0.9, -1.8]; // scattered final positions

    for (let d = 0; d < 4; d++) {
      const dx = dialStartX + d * dialSpacing;
      const dp = dialProgress[d];
      const isActive = activeDial === d;
      const isDone = dp === 1;

      // Glow behind active dial
      if (isActive) {
        ctx.save();
        ctx.globalAlpha = globalAlpha * 0.3;
        ctx.fillStyle = activeGlow;
        ctx.shadowColor = activeGlow;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(dx, dialY, dialRadius + 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Dial circle
      ctx.save();
      ctx.globalAlpha = globalAlpha * (isActive ? 0.8 : isDone ? 0.5 : 0.3);
      ctx.strokeStyle = isActive
        ? activeGlow
        : isDone
          ? goldColor
          : "rgba(255,255,255,0.4)";
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(dx, dialY, dialRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Rotating notch
      const angle = lerp(startAngles[d], endAngles[d], dp);
      ctx.save();
      ctx.globalAlpha = globalAlpha * (isActive ? 1 : isDone ? 0.7 : 0.4);
      ctx.strokeStyle = isActive ? activeGlow : isDone ? goldColor : greenColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx, dialY);
      ctx.lineTo(
        dx + Math.cos(angle) * (dialRadius - 1),
        dialY + Math.sin(angle) * (dialRadius - 1),
      );
      ctx.stroke();
      ctx.restore();
    }

    // Scanline
    ctx.globalAlpha = globalAlpha;
    const scanPos = ((time * 0.3) % 1) * width;
    const scanGrad = ctx.createLinearGradient(scanPos - 40, 0, scanPos + 40, 0);
    scanGrad.addColorStop(0, "transparent");
    scanGrad.addColorStop(0.5, "rgba(255,255,255,0.04)");
    scanGrad.addColorStop(1, "transparent");
    ctx.fillStyle = scanGrad;
    ctx.fillRect(scanPos - 40, 0, 80, height);

    ctx.globalAlpha = 1;

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return (
    <div className={styles.demoSection}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

/* ========================================
   Relative time formatting
   ======================================== */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ========================================
   TransmissionNoteFace — Table card face
   ======================================== */
export function TransmissionNoteFace() {
  return (
    <div className={styles.face}>
      <span className={styles.faceQuestion}>❓</span>
    </div>
  );
}

/* ========================================
   TransmissionNoteContent — Modal content
   ======================================== */
export function TransmissionNoteContent() {
  const [messages, setMessages] = useState<Transmission[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [transmitted, setTransmitted] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch existing messages on mount
  useEffect(() => {
    fetch("/api/transmissions")
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .catch(() => {});
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);

    // Optimistic add
    const optimistic: Transmission = {
      id: crypto.randomUUID(),
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const res = await fetch("/api/transmissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        // Replace optimistic with real
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.message : m)),
        );
      }
    } catch {
      // Keep optimistic message
    }

    setSending(false);
    setTransmitted(true);
    setTimeout(() => setTransmitted(false), 2000);
  }

  return (
    <div className={styles.container}>
      <TransmissionDemo />

      <div className={styles.narrative}>
        <p>i&apos;ve been trying to send you something.</p>
        <p>i know you&apos;re listening.</p>
        <p className={styles.signature}>~m</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.messagesSection}>
        {messages.length > 0 && (
          <div ref={listRef} className={styles.messagesList}>
            {messages.map((msg) => (
              <div key={msg.id} className={styles.messageItem}>
                <p className={styles.messageText}>{msg.text}</p>
                <div className={styles.messageTime}>
                  {relativeTime(msg.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputArea}>
          <textarea
            className={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="write back..."
            maxLength={2000}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className={styles.submitRow}>
            <button
              type="button"
              className={`${styles.sendButton} ${transmitted ? styles.transmitted : ""}`}
              onClick={handleSend}
              disabled={!input.trim() || sending}
            >
              {transmitted ? "\u2713 transmitted" : "send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
