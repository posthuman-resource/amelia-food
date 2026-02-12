import { useEffect, useRef, useState } from 'react';

// Emojis relevant to the site — warm, food, whimsy, personal
const PALETTE = [
  '🌙', '🍌', '💛', '✨', '🫶', '🌿', '🍊',
  '🦋', '🌸', '🕯️', '🫧', '🍯', '🧸', '🪴',
];

const SIZE = 7;
const MIN_MS = 10;
const MAX_MS = 1000;

// Banana running back and forth on a visible track
const PAD = '_';
const TRACK = 21;
const AWAY_FRAMES: string[] = [];
for (let i = 0; i < TRACK; i++)
  AWAY_FRAMES.push(PAD.repeat(i) + '🍌' + PAD.repeat(TRACK - 1 - i));
for (let i = TRACK - 2; i > 0; i--)
  AWAY_FRAMES.push(PAD.repeat(i) + '🍌' + PAD.repeat(TRACK - 1 - i));
const AWAY_INTERVAL = 80;

// Inline worker — un-throttled timer for background tab
const WORKER_SRC = `
  let id = null;
  self.onmessage = (e) => {
    if (id !== null) clearInterval(id);
    if (e.data.cmd === 'start') {
      id = setInterval(() => self.postMessage('tick'), e.data.ms);
    }
    if (e.data.cmd === 'stop') {
      id = null;
    }
  };
`;

function randomFrom(arr: string[], exclude?: string): string {
  const filtered = exclude ? arr.filter(e => e !== exclude) : arr;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function randomMs(): number {
  return MIN_MS + Math.floor(Math.random() * (MAX_MS - MIN_MS));
}

function randomRow(): string[] {
  const row: string[] = [];
  while (row.length < SIZE) {
    const pick = randomFrom(PALETTE);
    if (!row.includes(pick)) row.push(pick);
  }
  return row;
}

export function useTabTitle(unlocked: boolean): string {
  const [title, setTitle] = useState('🔒');
  const rowRef = useRef<string[]>(randomRow());
  const awayFrameRef = useRef(0);
  const hiddenRef = useRef(false);

  useEffect(() => {
    if (!unlocked) {
      setTitle('🔒');
      return;
    }

    setTitle(rowRef.current.join(''));

    // --- Away animation (Web Worker for un-throttled timer) ---
    const blob = new Blob([WORKER_SRC], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = () => {
      awayFrameRef.current = awayFrameRef.current % AWAY_FRAMES.length;
      setTitle(AWAY_FRAMES[awayFrameRef.current]);
      awayFrameRef.current++;
    };

    // --- Living animation (independent timer per emoji slot) ---
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    function scheduleSlot(idx: number) {
      timeouts[idx] = setTimeout(() => {
        rowRef.current[idx] = randomFrom(PALETTE, rowRef.current[idx]);
        setTitle(rowRef.current.join(''));
        if (!hiddenRef.current) scheduleSlot(idx);
      }, randomMs());
    }

    function startLiving() {
      for (let i = 0; i < SIZE; i++) scheduleSlot(i);
    }

    function stopLiving() {
      for (let i = 0; i < SIZE; i++) clearTimeout(timeouts[i]);
    }

    function onVisibilityChange() {
      hiddenRef.current = document.hidden;
      if (document.hidden) {
        stopLiving();
        awayFrameRef.current = 0;
        worker.postMessage({ cmd: 'start', ms: AWAY_INTERVAL });
      } else {
        worker.postMessage({ cmd: 'stop' });
        setTitle(rowRef.current.join(''));
        startLiving();
      }
    }

    hiddenRef.current = document.hidden;
    if (document.hidden) {
      worker.postMessage({ cmd: 'start', ms: AWAY_INTERVAL });
    } else {
      startLiving();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      stopLiving();
      worker.postMessage({ cmd: 'stop' });
      worker.terminate();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [unlocked]);

  return title;
}
