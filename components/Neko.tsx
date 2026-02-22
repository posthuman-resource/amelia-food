"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import styles from "./Neko.module.css";
import type { NekoVariant } from "@/lib/neko";

// Sprite frame coordinates [col, row] into the 32x32 grid sprite sheet.
// All variants share the same 256x128 layout (8 cols x 4 rows).
const spriteSets: Record<string, [number, number][]> = {
  idle: [[-3, -3]],
  alert: [[-7, -3]],
  scratchSelf: [
    [-5, 0],
    [-6, 0],
    [-7, 0],
  ],
  scratchWallN: [
    [0, 0],
    [0, -1],
  ],
  scratchWallS: [
    [-7, -1],
    [-6, -2],
  ],
  scratchWallE: [
    [-2, -2],
    [-2, -3],
  ],
  scratchWallW: [
    [-4, 0],
    [-4, -1],
  ],
  tired: [[-3, -2]],
  sleeping: [
    [-2, 0],
    [-2, -1],
  ],
  N: [
    [-1, -2],
    [-1, -3],
  ],
  NE: [
    [0, -2],
    [0, -3],
  ],
  E: [
    [-3, 0],
    [-3, -1],
  ],
  SE: [
    [-5, -1],
    [-5, -2],
  ],
  S: [
    [-6, -3],
    [-7, -2],
  ],
  SW: [
    [-5, -3],
    [-6, -1],
  ],
  W: [
    [-4, -2],
    [-4, -3],
  ],
  NW: [
    [-1, 0],
    [-1, -1],
  ],
};

const NEKO_SPEED = 10;
const SPRITE_SIZE = 32;
const HALF = SPRITE_SIZE / 2; // 16

function spriteUrl(variant: NekoVariant): string {
  return `/oneko/oneko-${variant}.gif`;
}

function setSprite(el: HTMLDivElement, name: string, frame: number) {
  const frames = spriteSets[name];
  if (!frames) return;
  const [col, row] = frames[frame % frames.length];
  el.style.backgroundPosition = `${col * SPRITE_SIZE}px ${row * SPRITE_SIZE}px`;
}

function isCursorChaseable(clientX: number, clientY: number): boolean {
  const el = document.elementFromPoint(clientX, clientY);
  if (!el) return false;
  let node: Element | null = el;
  while (node) {
    if ((node as HTMLElement).dataset?.nekoBlock === "true") return false;
    node = node.parentElement;
  }
  return true;
}

function parseLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// --- Component ---

interface NekoProps {
  tableRef: React.RefObject<HTMLDivElement | null>;
}

export default function Neko({ tableRef }: NekoProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMediaQuery("(pointer: coarse)");
  const nekoRef = useRef<HTMLDivElement>(null);

  // React state — initialized with SSR-safe defaults, synced from localStorage after mount
  const [variant, setVariant] = useState<NekoVariant>("classic");
  const [kuroNeko, setKuroNeko] = useState(false);
  const [forceSleep, setForceSleep] = useState(false);

  // Persist position across effect re-runs (variant/forceSleep changes re-run the effect)
  const positionRef = useRef<{ x: number; y: number } | null>(null);

  // Sync settings from localStorage on mount and from external changes (e.g., NekoCard UI)
  useEffect(() => {
    function sync() {
      setVariant(parseLocalStorage<NekoVariant>("neko-variant", "classic"));
      setKuroNeko(parseLocalStorage<boolean>("neko-kuro", false));
      setForceSleep(parseLocalStorage<boolean>("neko-force-sleep", false));
    }
    sync();
    window.addEventListener("neko-settings-changed", sync);
    return () => window.removeEventListener("neko-settings-changed", sync);
  }, []);

  // --- Main animation effect ---
  useEffect(() => {
    if (reducedMotion || isMobile) return;

    const container = tableRef.current;
    const nekoEl = nekoRef.current;
    if (!container || !nekoEl) return;

    // Non-null alias for use in closures (TypeScript can't narrow refs)
    const el = nekoEl;

    // Container dimensions — updated by ResizeObserver
    let containerWidth = container.clientWidth;
    let containerHeight = container.clientHeight;
    let containerRect = container.getBoundingClientRect();

    const resizeObserver = new ResizeObserver(() => {
      containerWidth = container.clientWidth;
      containerHeight = container.clientHeight;
      containerRect = container.getBoundingClientRect();
    });
    resizeObserver.observe(container);

    // Imperative state — mutable, no re-renders
    let nekoX = positionRef.current
      ? positionRef.current.x
      : containerWidth / 2;
    let nekoY = positionRef.current
      ? positionRef.current.y
      : containerHeight / 2;
    let mouseX = nekoX;
    let mouseY = nekoY;
    let cursorVisible = false;
    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation: string | null = null;
    let idleAnimationFrame = 0;
    let localForceSleep = forceSleep;
    let grabbing = false;
    let grabStop = false;
    let grabStopTimer: ReturnType<typeof setTimeout> | null = null;
    let nudge = false;
    let lastFrameTime = 0;
    let animationId = 0;

    // Place cat initially and set sprite to prevent stale backgroundPosition flash
    el.style.transform = `translate(${Math.round(nekoX - HALF)}px, ${Math.round(nekoY - HALF)}px)`;
    setSprite(el, localForceSleep ? "sleeping" : "idle", 0);

    // --- Mouse handlers ---

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX - containerRect.left;
      mouseY = e.clientY - containerRect.top;

      if (grabbing) {
        nekoX = mouseX;
        nekoY = mouseY;
        clampPosition();
        el.style.transform = `translate(${Math.round(nekoX - HALF)}px, ${Math.round(nekoY - HALF)}px)`;

        // Grab-stop detection
        if (grabStopTimer) clearTimeout(grabStopTimer);
        grabStop = false;
        grabStopTimer = setTimeout(() => {
          grabStop = true;
        }, 150);
      } else if (!localForceSleep) {
        cursorVisible = isCursorChaseable(e.clientX, e.clientY);
      }
    }

    function handleMouseLeave() {
      cursorVisible = false;
    }

    // --- Drag handlers ---

    function handleNekoMouseDown(e: MouseEvent) {
      if (e.button !== 0) return; // left click only
      e.preventDefault();
      grabbing = true;
      grabStop = false;
      nudge = false;
    }

    function handleMouseUp() {
      if (!grabbing) return;
      grabbing = false;
      grabStop = false;
      if (grabStopTimer) {
        clearTimeout(grabStopTimer);
        grabStopTimer = null;
      }
      nudge = true;
      resetIdleAnimation();
    }

    // --- Double-click: force sleep ---

    function handleNekoDblClick(e: MouseEvent) {
      e.preventDefault();
      localForceSleep = !localForceSleep;
      localStorage.setItem("neko-force-sleep", JSON.stringify(localForceSleep));
      window.dispatchEvent(new Event("neko-settings-changed"));
      if (localForceSleep) {
        mouseX = nekoX;
        mouseY = nekoY;
        resetIdleAnimation();
      } else {
        nudge = true;
        resetIdleAnimation();
      }
    }

    // --- Right-click: kuro neko ---

    function handleNekoContextMenu(e: MouseEvent) {
      e.preventDefault();
      const current = parseLocalStorage<boolean>("neko-kuro", false);
      const next = !current;
      localStorage.setItem("neko-kuro", JSON.stringify(next));
      window.dispatchEvent(new Event("neko-settings-changed"));
    }

    // --- Visibility change ---

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      } else {
        lastFrameTime = performance.now();
        animationId = requestAnimationFrame(tick);
      }
    }

    // --- State machine helpers ---

    function resetIdleAnimation() {
      idleAnimation = null;
      idleAnimationFrame = 0;
    }

    function clampPosition() {
      nekoX = Math.max(HALF, Math.min(containerWidth - HALF, nekoX));
      nekoY = Math.max(HALF, Math.min(containerHeight - HALF, nekoY));
    }

    // --- Idle state machine ---

    function idle() {
      idleTime++;

      // Force sleep: override to sleeping
      if (localForceSleep) {
        if (nudge) {
          setSprite(el, "alert", 0);
          nudge = false;
          return;
        }
        if (idleAnimationFrame < 8) {
          setSprite(el, "tired", 0);
        } else {
          setSprite(el, "sleeping", Math.floor(idleAnimationFrame / 4));
        }
        idleAnimationFrame++;
        return;
      }

      // Random delay before starting an idle animation
      // 1-in-200 chance per frame (~20s average at 10fps)
      if (
        !idleAnimation &&
        idleTime > 10 &&
        Math.floor(Math.random() * 200) === 0
      ) {
        const nearLeft = nekoX < SPRITE_SIZE;
        const nearRight = nekoX > containerWidth - SPRITE_SIZE * 2;
        const nearTop = nekoY < SPRITE_SIZE;
        const nearBottom = nekoY > containerHeight - SPRITE_SIZE * 2;

        const options: string[] = ["sleeping", "scratchSelf"];
        if (nearLeft) options.push("scratchWallW");
        if (nearRight) options.push("scratchWallE");
        if (nearTop) options.push("scratchWallN");
        if (nearBottom) options.push("scratchWallS");

        idleAnimation = options[Math.floor(Math.random() * options.length)];
        idleAnimationFrame = 0;
      }

      // No animation picked yet — just sit idle
      if (!idleAnimation) {
        setSprite(el, "idle", 0);
        return;
      }

      // Play the picked animation
      if (idleAnimation === "sleeping") {
        if (idleAnimationFrame < 8) {
          setSprite(el, "tired", 0);
        } else {
          setSprite(el, "sleeping", Math.floor(idleAnimationFrame / 4));
        }
        // Sleep terminates after ~19s (192 frames at 10fps)
        if (idleAnimationFrame > 192) {
          resetIdleAnimation();
        }
      } else {
        setSprite(el, idleAnimation, idleAnimationFrame);
        // Scratch terminates after ~1s (10 frames at 10fps)
        if (idleAnimationFrame > 9) {
          resetIdleAnimation();
        }
      }

      idleAnimationFrame++;
    }

    // --- Main tick ---

    function tick(timestamp: number) {
      if (document.hidden) return;

      // Throttle to ~100ms intervals (10 fps, matching oneko.js)
      if (timestamp - lastFrameTime < 100) {
        animationId = requestAnimationFrame(tick);
        return;
      }
      lastFrameTime = timestamp;
      frameCount++;

      // Save position for effect re-runs
      positionRef.current = { x: nekoX, y: nekoY };

      // --- Grabbing ---
      if (grabbing) {
        if (grabStop) {
          setSprite(el, "alert", 0);
        } else {
          // Directional scratch based on drag direction
          const dragDiffX = nekoX - mouseX;
          const dragDiffY = nekoY - mouseY;
          let scratchDir = "scratchSelf";
          if (Math.abs(dragDiffY) > Math.abs(dragDiffX)) {
            scratchDir = dragDiffY > 0 ? "scratchWallN" : "scratchWallS";
          } else {
            scratchDir = dragDiffX > 0 ? "scratchWallW" : "scratchWallE";
          }
          setSprite(el, scratchDir, frameCount);
        }
        animationId = requestAnimationFrame(tick);
        return;
      }

      // --- Not chasing conditions ---
      if (!cursorVisible || localForceSleep) {
        idle();
        animationId = requestAnimationFrame(tick);
        return;
      }

      // diffX/diffY: neko minus mouse (positive = neko is right/below mouse)
      const diffX = nekoX - mouseX;
      const diffY = nekoY - mouseY;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY);

      // Close enough — go idle
      if (distance < NEKO_SPEED || distance < 48) {
        idle();
        animationId = requestAnimationFrame(tick);
        return;
      }

      // Alert before chasing: show "alert" for a few frames
      if (idleTime > 1) {
        setSprite(el, "alert", 0);
        idleTime = Math.min(idleTime, 7);
        idleTime -= 1;
        animationId = requestAnimationFrame(tick);
        return;
      }

      // Reset idle state when chasing
      resetIdleAnimation();
      idleTime = 0;

      // Determine 8-directional movement
      // diffX > 0 means neko is right of mouse → go West
      // diffY > 0 means neko is below mouse → go North
      let direction = "";
      if (diffY / distance > 0.5) direction += "N";
      else if (diffY / distance < -0.5) direction += "S";
      if (diffX / distance > 0.5) direction += "W";
      else if (diffX / distance < -0.5) direction += "E";

      const spriteName = direction || "idle";
      setSprite(el, spriteName, frameCount);

      // Move toward cursor (subtract because diff = neko - mouse)
      nekoX -= (diffX / distance) * NEKO_SPEED;
      nekoY -= (diffY / distance) * NEKO_SPEED;

      // Clamp to container
      clampPosition();

      el.style.transform = `translate(${Math.round(nekoX - HALF)}px, ${Math.round(nekoY - HALF)}px)`;

      animationId = requestAnimationFrame(tick);
    }

    // --- Event listeners ---
    document.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibility);
    el.addEventListener("mousedown", handleNekoMouseDown);
    document.addEventListener("mouseup", handleMouseUp);
    el.addEventListener("dblclick", handleNekoDblClick);
    el.addEventListener("contextmenu", handleNekoContextMenu);

    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      el.removeEventListener("mousedown", handleNekoMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
      el.removeEventListener("dblclick", handleNekoDblClick);
      el.removeEventListener("contextmenu", handleNekoContextMenu);
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (grabStopTimer) clearTimeout(grabStopTimer);
    };
  }, [reducedMotion, isMobile, tableRef, variant, forceSleep]);

  if (reducedMotion || isMobile) return null;

  return (
    <div
      ref={nekoRef}
      className={styles.neko}
      style={{
        backgroundImage: `url(${spriteUrl(variant)})`,
      }}
      aria-hidden="true"
    />
  );
}
