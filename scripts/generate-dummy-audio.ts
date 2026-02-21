/**
 * Generates dummy WAV files for each signal channel.
 * These simulate speech-like cadence with modulated sine tones,
 * serving as placeholders until real voice recordings are added.
 *
 * Usage: npx tsx scripts/generate-dummy-audio.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SAMPLE_RATE = 44100;
const DURATION = 18; // seconds
const NUM_SAMPLES = SAMPLE_RATE * DURATION;

const SIGNALS = [
  "static",
  "contact",
  "frequency",
  "decode",
  "carrier-wave",
  "transmission",
  "still-listening",
];

// Each signal gets a slightly different "voice" character
const VOICE_PARAMS = [
  { baseFreq: 160, formant1: 700, formant2: 1200, tempo: 3.5 },
  { baseFreq: 150, formant1: 750, formant2: 1100, tempo: 3.0 },
  { baseFreq: 170, formant1: 680, formant2: 1300, tempo: 3.8 },
  { baseFreq: 155, formant1: 720, formant2: 1150, tempo: 3.2 },
  { baseFreq: 165, formant1: 690, formant2: 1250, tempo: 3.6 },
  { baseFreq: 145, formant1: 730, formant2: 1180, tempo: 2.8 },
  { baseFreq: 175, formant1: 710, formant2: 1220, tempo: 3.4 },
];

function generateSpeechLikeTone(
  params: (typeof VOICE_PARAMS)[0],
): Float32Array {
  const samples = new Float32Array(NUM_SAMPLES);
  const { baseFreq, formant1, formant2, tempo } = params;

  for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;

    // Syllable envelope — simulates speech rhythm
    const syllableEnv =
      0.5 +
      0.3 * Math.sin(2 * Math.PI * tempo * t) +
      0.2 * Math.sin(2 * Math.PI * (tempo * 0.7) * t + 1.3);

    // Pause gaps — brief silence between "phrases"
    const phraseGap = Math.sin(2 * Math.PI * 0.15 * t);
    const envelope = Math.max(0, syllableEnv) * (phraseGap > -0.3 ? 1 : 0.05);

    // Glottal pulse (voiced speech fundamental)
    const glottal =
      Math.sin(2 * Math.PI * baseFreq * t) * 0.4 +
      Math.sin(2 * Math.PI * baseFreq * 2 * t) * 0.2 +
      Math.sin(2 * Math.PI * baseFreq * 3 * t) * 0.1;

    // Formant resonances (vowel-like quality)
    const f1 =
      Math.sin(
        2 * Math.PI * formant1 * t + Math.sin(2 * Math.PI * 5 * t) * 0.3,
      ) * 0.15;
    const f2 =
      Math.sin(
        2 * Math.PI * formant2 * t + Math.sin(2 * Math.PI * 7 * t) * 0.2,
      ) * 0.08;

    // Slight pitch drift
    const drift = Math.sin(2 * Math.PI * 0.4 * t) * 0.02;

    samples[i] = (glottal + f1 + f2 + drift) * envelope * 0.6;
  }

  return samples;
}

function encodeWav(samples: Float32Array): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = SAMPLE_RATE * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);

  const buffer = Buffer.alloc(44 + dataSize);
  let offset = 0;

  // RIFF header
  buffer.write("RIFF", offset);
  offset += 4;
  buffer.writeUInt32LE(36 + dataSize, offset);
  offset += 4;
  buffer.write("WAVE", offset);
  offset += 4;

  // fmt chunk
  buffer.write("fmt ", offset);
  offset += 4;
  buffer.writeUInt32LE(16, offset);
  offset += 4;
  buffer.writeUInt16LE(1, offset);
  offset += 2; // PCM
  buffer.writeUInt16LE(numChannels, offset);
  offset += 2;
  buffer.writeUInt32LE(SAMPLE_RATE, offset);
  offset += 4;
  buffer.writeUInt32LE(byteRate, offset);
  offset += 4;
  buffer.writeUInt16LE(blockAlign, offset);
  offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset);
  offset += 2;

  // data chunk
  buffer.write("data", offset);
  offset += 4;
  buffer.writeUInt32LE(dataSize, offset);
  offset += 4;

  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    buffer.writeInt16LE(Math.round(int16), offset);
    offset += 2;
  }

  return buffer;
}

const outDir = join(process.cwd(), "public", "audio", "signals");
mkdirSync(outDir, { recursive: true });

for (let i = 0; i < SIGNALS.length; i++) {
  const name = SIGNALS[i];
  const params = VOICE_PARAMS[i];
  console.log(`Generating ${name}.wav ...`);
  const samples = generateSpeechLikeTone(params);
  const wav = encodeWav(samples);
  writeFileSync(join(outDir, `${name}.wav`), wav);
}

console.log(`Done — ${SIGNALS.length} files written to public/audio/signals/`);
