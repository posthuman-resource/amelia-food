"use client";

import { useState, useEffect, useRef } from "react";
import { createNoise2D } from "simplex-noise";
import styles from "./TableCats.module.css";

interface ObjectPosition {
  id: string;
  x: number;
  y: number;
}

interface TableCatsProps {
  objectPositions: ObjectPosition[];
}

type CatBehavior =
  | "idle"
  | "walking"
  | "hiding"
  | "peeking"
  | "napping"
  | "scampering";

// ── Helpers ──

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function randomTablePosition() {
  return { x: randomBetween(10, 90), y: randomBetween(15, 90) };
}

function randomObject(objects: ObjectPosition[]): ObjectPosition | null {
  if (objects.length === 0) return null;
  return objects[Math.floor(Math.random() * objects.length)];
}

function nearPosition(obj: ObjectPosition, offset: number) {
  const angle = Math.random() * Math.PI * 2;
  return {
    x: clamp(obj.x + Math.cos(angle) * offset, 5, 95),
    y: clamp(obj.y + Math.sin(angle) * offset, 10, 95),
  };
}

// ── Noise path generation ──

const noise2D = createNoise2D();

interface Waypoint {
  x: number;
  y: number;
  /** Cumulative time (ms) at which we should reach this waypoint */
  time: number;
}

/**
 * Generate a curved, organic path from A to B using simplex noise.
 * Each waypoint has a cumulative timestamp so we can smoothly lerp between them.
 */
function generatePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  durationMs: number,
  steps: number,
  curviness: number = 0.15,
): Waypoint[] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 0.5) return [{ x: to.x, y: to.y, time: durationMs }];

  // Perpendicular direction for noise offset
  const perpX = -dy / dist;
  const perpY = dx / dist;
  const seed = Math.random() * 1000;

  const waypoints: Waypoint[] = [];
  let cumulativeTime = 0;
  const baseStepTime = durationMs / steps;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Ease-in-out: slow start, quick middle, slow end
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    const baseX = from.x + dx * eased;
    const baseY = from.y + dy * eased;

    // Noise-based curve offset, peaks in the middle
    const noiseVal = noise2D(t * 3 + seed, seed * 0.5);
    const amplitude = dist * curviness * Math.sin(t * Math.PI);
    const offsetX = perpX * noiseVal * amplitude;
    const offsetY = perpY * noiseVal * amplitude;

    // Add a micro-pause at some waypoints (extends time at that point)
    let stepTime = baseStepTime;
    if (i > 2 && i < steps - 2 && Math.random() < 0.12) {
      stepTime += 150 + Math.random() * 400; // pause
    }
    cumulativeTime += stepTime;

    waypoints.push({
      x: clamp(baseX + offsetX, 3, 97),
      y: clamp(baseY + offsetY, 8, 95),
      time: cumulativeTime,
    });
  }

  return waypoints;
}

// ── Cat hook ──

interface CatOutput {
  emoji: string;
  behavior: CatBehavior;
  facingLeft: boolean;
  elementRef: React.RefObject<HTMLDivElement | null>;
}

function useCat(
  emoji: string,
  objectPositions: ObjectPosition[],
  reducedMotion: boolean,
): CatOutput {
  const [behavior, setBehavior] = useState<CatBehavior>("idle");
  const [facingLeft, setFacingLeft] = useState(false);

  const elementRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(randomTablePosition());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const rafRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const visibleRef = useRef(true);
  const objectsRef = useRef(objectPositions);
  objectsRef.current = objectPositions;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  // Set initial position once the element mounts
  useEffect(() => {
    const el = elementRef.current;
    if (el) {
      el.style.left = `${posRef.current.x}%`;
      el.style.top = `${posRef.current.y}%`;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    function safeClearTimeout() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    }

    function safeCancelRaf() {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    }

    function safeTimeout(fn: () => void, ms: number) {
      safeClearTimeout();
      if (!mountedRef.current) return;
      if (document.hidden) {
        const onVisible = () => {
          document.removeEventListener("visibilitychange", onVisible);
          if (mountedRef.current) safeTimeout(fn, ms);
        };
        document.addEventListener("visibilitychange", onVisible);
        return;
      }
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current && visibleRef.current) fn();
      }, ms);
    }

    /**
     * Animate the cat along a noise-curved path via requestAnimationFrame.
     * Continuously interpolates between waypoints for smooth 60fps movement.
     */
    function animatePath(
      to: { x: number; y: number },
      durationMs: number,
      steps: number,
      curviness: number,
      onDone: () => void,
    ) {
      safeCancelRaf();
      if (!elementRef.current || !mountedRef.current) return;
      const el = elementRef.current!;

      const from = { ...posRef.current };
      const waypoints = generatePath(from, to, durationMs, steps, curviness);
      const totalTime = waypoints[waypoints.length - 1].time;
      const startTime = performance.now();

      // Set facing direction
      const goingLeft = to.x < from.x;
      setFacingLeft(goingLeft);
      el.style.transform = `translate(-50%, -50%)${goingLeft ? " scaleX(-1)" : ""}`;

      // Prepend the starting position as waypoint 0
      const allPoints = [{ x: from.x, y: from.y, time: 0 }, ...waypoints];

      function tick(now: number) {
        if (!mountedRef.current) return;

        const elapsed = now - startTime;

        if (elapsed >= totalTime) {
          // Done — snap to final position
          posRef.current = { x: to.x, y: to.y };
          el.style.left = `${to.x}%`;
          el.style.top = `${to.y}%`;
          onDone();
          return;
        }

        // Find the two waypoints we're between
        let segStart = allPoints[0];
        let segEnd = allPoints[1];
        for (let i = 1; i < allPoints.length; i++) {
          if (allPoints[i].time >= elapsed) {
            segStart = allPoints[i - 1];
            segEnd = allPoints[i];
            break;
          }
        }

        // Lerp between them
        const segDuration = segEnd.time - segStart.time;
        const segProgress =
          segDuration > 0 ? (elapsed - segStart.time) / segDuration : 1;
        const x = lerp(segStart.x, segEnd.x, segProgress);
        const y = lerp(segStart.y, segEnd.y, segProgress);

        posRef.current = { x, y };
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;

        rafRef.current = requestAnimationFrame(tick);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    /** Walk to a position with organic movement */
    function walkTo(dest: { x: number; y: number }, onDone: () => void) {
      setBehavior("walking");
      animatePath(dest, randomBetween(2200, 3200), 35, 0.15, onDone);
    }

    /** Scamper quickly to a position */
    function scamperTo(dest: { x: number; y: number }, onDone: () => void) {
      setBehavior("scampering");
      animatePath(dest, randomBetween(500, 800), 12, 0.06, onDone);
    }

    /** Slow creep to a position (for hiding/peeking transitions) */
    function creepTo(dest: { x: number; y: number }, onDone: () => void) {
      animatePath(dest, randomBetween(800, 1200), 10, 0.04, onDone);
    }

    /** Subtle idle drift — tiny noise-based sway */
    let idleDriftRaf = 0;
    const idleSeed = Math.random() * 1000;
    function startIdleDrift() {
      if (!elementRef.current) return;
      const el = elementRef.current!;
      const basePos = { ...posRef.current };
      const startTime = performance.now();

      function drift(now: number) {
        if (!mountedRef.current) return;
        const t = (now - startTime) / 1000;
        const driftX = noise2D(t * 0.3 + idleSeed, 0) * 0.3;
        const driftY = noise2D(0, t * 0.3 + idleSeed) * 0.3;
        const x = clamp(basePos.x + driftX, 3, 97);
        const y = clamp(basePos.y + driftY, 8, 95);
        el.style.left = `${x}%`;
        el.style.top = `${y}%`;
        idleDriftRaf = requestAnimationFrame(drift);
      }
      idleDriftRaf = requestAnimationFrame(drift);
    }

    function stopIdleDrift() {
      if (idleDriftRaf) {
        cancelAnimationFrame(idleDriftRaf);
        idleDriftRaf = 0;
      }
    }

    function goIdle(thenNext: () => void) {
      setBehavior("idle");
      startIdleDrift();
      safeTimeout(
        () => {
          stopIdleDrift();
          thenNext();
        },
        randomBetween(6000, 15000),
      );
    }

    function nextAction() {
      if (reducedMotionRef.current || !mountedRef.current) return;

      const roll = Math.random();
      const obj = randomObject(objectsRef.current);

      if (roll < 0.4) {
        // Walk to random spot
        walkTo(randomTablePosition(), () => {
          goIdle(nextAction);
        });
      } else if (roll < 0.65 && obj) {
        // Walk near a card → hide → peek → emerge
        const hideSpot = nearPosition(obj, 4);
        walkTo(hideSpot, () => {
          setBehavior("hiding");
          creepTo({ x: obj.x, y: obj.y }, () => {
            safeTimeout(
              () => {
                setBehavior("peeking");
                const peekSpot = nearPosition(obj, 3);
                creepTo(peekSpot, () => {
                  safeTimeout(
                    () => {
                      walkTo(randomTablePosition(), () => {
                        goIdle(nextAction);
                      });
                    },
                    randomBetween(2000, 4000),
                  );
                });
              },
              randomBetween(3000, 6000),
            );
          });
        });
      } else if (roll < 0.8 && obj) {
        // Walk onto a card → nap → wake → leave
        walkTo({ x: obj.x, y: obj.y }, () => {
          setBehavior("napping");
          safeTimeout(
            () => {
              walkTo(randomTablePosition(), () => {
                goIdle(nextAction);
              });
            },
            randomBetween(8000, 15000),
          );
        });
      } else {
        // Scamper across table
        scamperTo(randomTablePosition(), () => {
          goIdle(nextAction);
        });
      }
    }

    const handleVisibility = () => {
      visibleRef.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Initial delay before first action
    if (!reducedMotion) {
      startIdleDrift();
      safeTimeout(
        () => {
          stopIdleDrift();
          nextAction();
        },
        randomBetween(3000, 8000),
      );
    }

    return () => {
      mountedRef.current = false;
      safeClearTimeout();
      safeCancelRaf();
      stopIdleDrift();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { emoji, behavior, facingLeft, elementRef };
}

// ── Component ──

const CAT_EMOJIS = ["🐈", "🐈‍⬛", "🐈", "🐈‍⬛"];

function catClassName(behavior: CatBehavior, facingLeft: boolean): string {
  const classes = [styles.cat];
  if (behavior === "hiding") classes.push(styles.hiding);
  if (behavior === "peeking") classes.push(styles.peeking);
  if (behavior === "napping") {
    classes.push(facingLeft ? styles.nappingFlipped : styles.napping);
  }
  return classes.join(" ");
}

export default function TableCats({ objectPositions }: TableCatsProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const cat1 = useCat(CAT_EMOJIS[0], objectPositions, reducedMotion);
  const cat2 = useCat(CAT_EMOJIS[1], objectPositions, reducedMotion);
  const cat3 = useCat(CAT_EMOJIS[2], objectPositions, reducedMotion);
  const cat4 = useCat(CAT_EMOJIS[3], objectPositions, reducedMotion);

  const cats = isMobile ? [cat1, cat2] : [cat1, cat2, cat3, cat4];

  return (
    <>
      {cats.map((cat, i) => (
        <div
          key={i}
          ref={cat.elementRef}
          className={catClassName(cat.behavior, cat.facingLeft)}
          style={
            isMobile
              ? { transform: cat.facingLeft ? "scaleX(-1)" : "none" }
              : undefined
          }
          aria-hidden="true"
        >
          {cat.behavior === "napping" ? "😺" : cat.emoji}
        </div>
      ))}
    </>
  );
}
