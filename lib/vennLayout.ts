/**
 * Pure word-packing algorithm for Venn diagram layout.
 * No React — runs in the browser using Canvas API for text measurement.
 */

import type { VennSection, VennEntry } from "@/lib/venn";
export type { VennEntry };

export interface PlacedWord {
  id: string;
  text: string;
  section: VennSection;
  x: number;
  y: number;
  fontSize: number;
  rotation: number;
  color: string;
}

export interface CircleGeometry {
  cx1: number;
  cy: number;
  cx2: number;
  r: number;
}

const WORD_COLORS = [
  "#6b2d5b", // plum
  "#2d5b4b", // green
  "#c4723a", // terracotta
  "#8b3a62", // plum-light
  "#3a6b5b", // green-light
  "#c4a265", // gold
  "#722f37", // burgundy
  "#b8956a", // gold-muted
];

const ROTATION_ANGLES = [0, 0, 0, -18, 18, -30, 30];
const OVERLAP_RATIO = 0.72;
const PADDING = 2; // px between words

// — Font sizing —
const MAX_FONT_SIZE = 14; // absolute ceiling for any word
const MIN_FONT_SIZE = 7; // smallest a word can shrink to
const FONT_STEP = 1; // decrement per sizing attempt
const DENSITY_FACTOR = 150; // larger = bigger fonts when few words (globalCap = DENSITY_FACTOR / √totalCount)
const LINE_HEIGHT = 1; // text bounding box height multiplier

// — Region scaling (controls per-section font cap) —
const REGION_SCALE_BOTH = 0.7; // overlap lens — larger region, more room
const REGION_SCALE_SIDE = 0.55; // left/right crescents — tighter, harder to pack

// — Placement —
const INSET_MARGIN = 6; // px inset from circle edge for word corners
const SPIRAL_STEPS = 1200; // max spiral positions to try per word
const SPIRAL_ANGLE_STEP = 0.25; // radians per spiral step (tightness of spiral)
const SPIRAL_RADIUS_STEP = 0.7; // px outward per spiral step

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function colorForWord(text: string): string {
  return WORD_COLORS[hashString(text) % WORD_COLORS.length];
}

export function computeCircles(
  containerWidth: number,
  containerHeight: number,
): CircleGeometry {
  const r = containerWidth * 0.36;
  const d = r * 2 * (1 - OVERLAP_RATIO);
  const cx1 = containerWidth / 2 - d / 2;
  const cx2 = containerWidth / 2 + d / 2;
  const cy = containerHeight / 2;
  return { cx1, cy, cx2, r };
}

function inLeftCircle(
  x: number,
  y: number,
  g: CircleGeometry,
  margin = 0,
): boolean {
  const dx = x - g.cx1;
  const dy = y - g.cy;
  return dx * dx + dy * dy <= (g.r - margin) * (g.r - margin);
}

function inRightCircle(
  x: number,
  y: number,
  g: CircleGeometry,
  margin = 0,
): boolean {
  const dx = x - g.cx2;
  const dy = y - g.cy;
  return dx * dx + dy * dy <= (g.r - margin) * (g.r - margin);
}

function inRegion(
  x: number,
  y: number,
  section: VennSection,
  g: CircleGeometry,
  margin = 0,
): boolean {
  const inL = inLeftCircle(x, y, g, margin);
  const inR = inRightCircle(x, y, g, margin);
  if (section === "left") return inL && !inRightCircle(x, y, g, -margin);
  if (section === "right") return !inLeftCircle(x, y, g, -margin) && inR;
  return inL && inR; // both
}

function regionCentroid(
  section: VennSection,
  g: CircleGeometry,
): { x: number; y: number } {
  if (section === "both") {
    return { x: (g.cx1 + g.cx2) / 2, y: g.cy };
  }
  if (section === "left") {
    // Midpoint between left circle center and leftmost edge
    return { x: (g.cx1 + (g.cx1 - g.r)) / 2, y: g.cy };
  }
  // right
  return { x: (g.cx2 + (g.cx2 + g.r)) / 2, y: g.cy };
}

interface Rect {
  cx: number;
  cy: number;
  hw: number; // half-width
  hh: number; // half-height
  angle: number; // radians
}

function rotatedCorners(r: Rect): [number, number][] {
  const cos = Math.cos(r.angle);
  const sin = Math.sin(r.angle);
  const dxs = [-r.hw, r.hw, r.hw, -r.hw];
  const dys = [-r.hh, -r.hh, r.hh, r.hh];
  return dxs.map((dx, i) => [
    r.cx + dx * cos - dys[i] * sin,
    r.cy + dx * sin + dys[i] * cos,
  ]);
}

// Separating Axis Theorem for two rotated rectangles
function rectsOverlap(a: Rect, b: Rect): boolean {
  const cornersA = rotatedCorners(a);
  const cornersB = rotatedCorners(b);

  const axes: [number, number][] = [];
  // Two edge normals from each rect
  for (const corners of [cornersA, cornersB]) {
    for (let i = 0; i < 2; i++) {
      const dx = corners[i + 1][0] - corners[i][0];
      const dy = corners[i + 1][1] - corners[i][1];
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) axes.push([-dy / len, dx / len]);
    }
  }

  for (const [ax, ay] of axes) {
    let minA = Infinity,
      maxA = -Infinity;
    for (const [px, py] of cornersA) {
      const proj = px * ax + py * ay;
      if (proj < minA) minA = proj;
      if (proj > maxA) maxA = proj;
    }
    let minB = Infinity,
      maxB = -Infinity;
    for (const [px, py] of cornersB) {
      const proj = px * ax + py * ay;
      if (proj < minB) minB = proj;
      if (proj > maxB) maxB = proj;
    }
    if (maxA <= minB || maxB <= minA) return false;
  }
  return true;
}

// Quick AABB rejection before SAT
function aabbOverlap(a: Rect, b: Rect): boolean {
  const maxDim = (r: Rect) => Math.max(r.hw, r.hh) * 1.42; // sqrt(2)
  const da = maxDim(a);
  const db = maxDim(b);
  return Math.abs(a.cx - b.cx) < da + db && Math.abs(a.cy - b.cy) < da + db;
}

let _canvas: HTMLCanvasElement | null = null;
let _ctx: CanvasRenderingContext2D | null = null;

function getCtx(): CanvasRenderingContext2D {
  if (!_ctx) {
    _canvas = document.createElement("canvas");
    _ctx = _canvas.getContext("2d")!;
  }
  return _ctx;
}

function measureText(text: string, fontSize: number): number {
  const ctx = getCtx();
  ctx.font = `${fontSize}px Lora, serif`;
  return ctx.measureText(text).width;
}

export interface LayoutResult {
  placed: PlacedWord[];
  hidden: VennEntry[];
}

export function layoutWords(
  entries: VennEntry[],
  containerWidth: number,
  containerHeight: number,
): LayoutResult {
  if (entries.length === 0 || containerWidth === 0 || containerHeight === 0)
    return { placed: [], hidden: [] };

  const g = computeCircles(containerWidth, containerHeight);
  const placed: PlacedWord[] = [];
  const hidden: VennEntry[] = [];
  const placedRects: Rect[] = [];

  const sections: VennSection[] = ["both", "left", "right"];
  // Global font cap based on total entries — scales down when diagram is dense
  const totalCount = entries.length;
  const globalCap = Math.min(
    MAX_FONT_SIZE,
    Math.max(MIN_FONT_SIZE, DENSITY_FACTOR / Math.sqrt(totalCount)),
  );

  for (const section of sections) {
    const sectionEntries = entries
      .filter((e) => e.section === section)
      .sort((a, b) => b.text.length - a.text.length);

    if (sectionEntries.length === 0) continue;

    const centroid = regionCentroid(section, g);

    // Region-aware scaling: at OVERLAP_RATIO=0.69 the lens is ~61% of a circle,
    // crescents are ~39% each — and crescents are harder to pack (thin curved shape)
    const regionScale =
      section === "both" ? REGION_SCALE_BOTH : REGION_SCALE_SIDE;
    const sectionCap = Math.min(
      MAX_FONT_SIZE,
      Math.max(
        MIN_FONT_SIZE,
        (g.r * regionScale) / Math.sqrt(sectionEntries.length),
      ),
    );
    const maxFontSize = Math.min(globalCap, sectionCap);

    for (let wi = 0; wi < sectionEntries.length; wi++) {
      const entry = sectionEntries[wi];
      const preferredDeg =
        ROTATION_ANGLES[hashString(entry.text + wi) % ROTATION_ANGLES.length];
      const color = colorForWord(entry.text);

      // Try preferred rotation first, then fall back to 0 (tightest bbox)
      const rotationsToTry = preferredDeg !== 0 ? [preferredDeg, 0] : [0];
      let didPlace = false;

      for (const rotationDeg of rotationsToTry) {
        if (didPlace) break;
        const rotationRad = (rotationDeg * Math.PI) / 180;

        for (
          let fontSize = maxFontSize;
          fontSize >= MIN_FONT_SIZE;
          fontSize -= FONT_STEP
        ) {
          const textWidth = measureText(entry.text, fontSize);
          const hw = (textWidth + PADDING) / 2;
          const hh = (fontSize * LINE_HEIGHT + PADDING) / 2;

          // Spiral search from centroid
          for (let t = 0; t < SPIRAL_STEPS; t++) {
            const theta = t * SPIRAL_ANGLE_STEP;
            const rSpiral = t * SPIRAL_RADIUS_STEP;
            const cx = centroid.x + rSpiral * Math.cos(theta);
            const cy = centroid.y + rSpiral * Math.sin(theta);

            const candidate: Rect = {
              cx,
              cy,
              hw,
              hh,
              angle: rotationRad,
            };

            // Check all corners are in region
            const corners = rotatedCorners(candidate);
            const allInRegion = corners.every(([px, py]) =>
              inRegion(px, py, section, g, INSET_MARGIN),
            );
            if (!allInRegion) continue;

            // Check no collision with placed words
            let collision = false;
            for (const pr of placedRects) {
              if (aabbOverlap(candidate, pr) && rectsOverlap(candidate, pr)) {
                collision = true;
                break;
              }
            }
            if (collision) continue;

            // Place it
            placed.push({
              id: entry.id,
              text: entry.text,
              section: entry.section,
              x: cx,
              y: cy,
              fontSize,
              rotation: rotationDeg,
              color,
            });
            placedRects.push(candidate);
            didPlace = true;
            break;
          }

          if (didPlace) break;
        }
      }

      if (!didPlace) {
        hidden.push(entry);
      }
    }
  }

  return { placed, hidden };
}
