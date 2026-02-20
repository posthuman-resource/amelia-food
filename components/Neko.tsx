"use client";

import { useEffect, useRef } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import styles from "./Neko.module.css";

// Sprite frame coordinates [col, row] into the 32x32 grid sprite sheet
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

interface NekoProps {
  tableRef: React.RefObject<HTMLDivElement | null>;
}

export default function Neko({ tableRef }: NekoProps) {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isMobile = useMediaQuery("(pointer: coarse)");
  const nekoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion || isMobile) return;

    const container = tableRef.current;
    const nekoEl = nekoRef.current;
    if (!container || !nekoEl) return;

    // Cached container dimensions — updated by ResizeObserver, not per-frame
    let containerWidth = container.clientWidth;
    let containerHeight = container.clientHeight;
    let containerRect = container.getBoundingClientRect();

    const resizeObserver = new ResizeObserver(() => {
      containerWidth = container.clientWidth;
      containerHeight = container.clientHeight;
      containerRect = container.getBoundingClientRect();
    });
    resizeObserver.observe(container);

    // State refs — all mutation, no React re-renders
    let nekoX = containerWidth / 2;
    let nekoY = containerHeight / 2;
    let mouseX = nekoX;
    let mouseY = nekoY;
    let cursorVisible = false;
    let frameCount = 0;
    let idleTime = 0;
    let idleAnimation: string | null = null;
    let idleAnimationFrame = 0;
    let lastFrameTime = 0;
    let animationId = 0;

    // Place cat initially
    nekoEl.style.left = `${nekoX}px`;
    nekoEl.style.top = `${nekoY}px`;

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX - containerRect.left;
      mouseY = e.clientY - containerRect.top;
      cursorVisible = isCursorChaseable(e.clientX, e.clientY);
    }

    function handleMouseLeave() {
      cursorVisible = false;
    }

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
        animationId = 0;
      } else {
        lastFrameTime = performance.now();
        animationId = requestAnimationFrame(tick);
      }
    }

    function tick(timestamp: number) {
      if (document.hidden) return;

      // Throttle to ~100ms intervals (10 fps, matching oneko.js)
      if (timestamp - lastFrameTime < 100) {
        animationId = requestAnimationFrame(tick);
        return;
      }
      lastFrameTime = timestamp;
      frameCount++;

      if (!cursorVisible) {
        idle();
        animationId = requestAnimationFrame(tick);
        return;
      }

      const diffX = mouseX - nekoX;
      const diffY = mouseY - nekoY;
      const distance = Math.sqrt(diffX * diffX + diffY * diffY);

      // Close enough — go idle
      if (distance < NEKO_SPEED) {
        idle();
        animationId = requestAnimationFrame(tick);
        return;
      }

      // Reset idle state when chasing
      idleAnimation = null;
      idleAnimationFrame = 0;
      idleTime = 0;

      // Determine direction
      let direction = "";
      if (diffY / distance > 0.5) direction += "S";
      else if (diffY / distance < -0.5) direction += "N";
      if (diffX / distance > 0.5) direction += "E";
      else if (diffX / distance < -0.5) direction += "W";

      const spriteName = direction || "idle";
      setSprite(nekoEl!, spriteName, frameCount);

      // Move toward cursor
      nekoX += (diffX / distance) * NEKO_SPEED;
      nekoY += (diffY / distance) * NEKO_SPEED;

      // Clamp to container
      nekoX = Math.max(0, Math.min(containerWidth - SPRITE_SIZE, nekoX));
      nekoY = Math.max(0, Math.min(containerHeight - SPRITE_SIZE, nekoY));

      nekoEl!.style.left = `${nekoX}px`;
      nekoEl!.style.top = `${nekoY}px`;

      animationId = requestAnimationFrame(tick);
    }

    function idle() {
      idleTime++;

      // First show alert, then tired
      if (idleTime < 10) {
        setSprite(nekoEl!, "alert", 0);
        return;
      }

      // Start an idle animation after enough idle time
      if (!idleAnimation) {
        // Pick a random idle animation
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

      if (idleAnimation === "sleeping") {
        if (idleAnimationFrame < 8) {
          setSprite(nekoEl!, "tired", 0);
        } else {
          setSprite(nekoEl!, "sleeping", Math.floor(idleAnimationFrame / 4));
        }
      } else {
        setSprite(nekoEl!, idleAnimation, idleAnimationFrame);
      }

      idleAnimationFrame++;
    }

    // Listen on document so we track cursor globally and convert to container coords
    document.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("visibilitychange", handleVisibility);

    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [reducedMotion, isMobile, tableRef]);

  if (reducedMotion || isMobile) return null;

  return <div ref={nekoRef} className={styles.neko} aria-hidden="true" />;
}
