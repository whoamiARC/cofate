import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sampleRate = 44_100;

function writeStereoWav(name, duration, render) {
  const frameCount = Math.ceil(sampleRate * duration);
  const samples = new Float32Array(frameCount * 2);
  let peak = 0;

  for (let frame = 0; frame < frameCount; frame += 1) {
    const [left, right] = render(frame / sampleRate);
    samples[frame * 2] = left;
    samples[frame * 2 + 1] = right;
    peak = Math.max(peak, Math.abs(left), Math.abs(right));
  }

  const scale = peak > 0 ? 0.78 / peak : 1;
  const dataSize = frameCount * 4;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const offset = 44 + frame * 4;
    wav.writeInt16LE(Math.round(samples[frame * 2] * scale * 32_767), offset);
    wav.writeInt16LE(Math.round(samples[frame * 2 + 1] * scale * 32_767), offset + 2);
  }

  const output = resolve(root, `public/audio/${name}.wav`);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, wav);
  console.log(output);
}

function seededNoise(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296 * 2 - 1;
  };
}

function paperEnvelope(time, start, length, power = 1.35) {
  if (time < start || time >= start + length) return 0;
  const position = (time - start) / length;
  return Math.sin(position * Math.PI) ** power;
}

function paperRenderer(seed, kind) {
  const noiseLeft = seededNoise(seed);
  const noiseRight = seededNoise(seed + 113);
  let fastLeft = 0;
  let fastRight = 0;
  let slowLeft = 0;
  let slowRight = 0;

  return (time) => {
    fastLeft = fastLeft * 0.58 + noiseLeft() * 0.42;
    fastRight = fastRight * 0.58 + noiseRight() * 0.42;
    slowLeft = slowLeft * 0.955 + fastLeft * 0.045;
    slowRight = slowRight * 0.955 + fastRight * 0.045;
    const fibreLeft = fastLeft - slowLeft;
    const fibreRight = fastRight - slowRight;

    if (kind === "tap") {
      const flick = paperEnvelope(time, 0.006, 0.145, 1.6);
      const grain = 0.82 + 0.13 * Math.sin(Math.PI * 2 * 31 * time) + 0.05 * Math.sin(Math.PI * 2 * 67 * time);
      const pageBody = (slowLeft + slowRight) * 0.09 * flick;
      return [fibreLeft * flick * grain + pageBody, fibreRight * flick * grain + pageBody];
    }

    const sweep = paperEnvelope(time, 0.012, 0.34, 1.18);
    const curl = paperEnvelope(time, 0.19, 0.23, 1.7);
    const landingTime = Math.max(0, time - 0.335);
    const landing = time >= 0.335 ? Math.exp(-landingTime * 25) : 0;
    const fibres = 0.74 + 0.16 * Math.sin(Math.PI * 2 * 24 * time) + 0.1 * Math.sin(Math.PI * 2 * 53 * time);
    const pan = Math.min(1, Math.max(0, time / 0.38));
    const body = (slowLeft + slowRight) * landing * 0.2;
    const left = fibreLeft * (sweep * (1.08 - pan * 0.36) + curl * 0.24) * fibres + body;
    const right = fibreRight * (sweep * (0.72 + pan * 0.42) + curl * 0.31) * fibres + body;
    return [left, right];
  };
}

// A short page-edge flick for navigation and a fuller page turn for actions
// that advance the story. Both are deterministic, original paper textures.
writeStereoWav("cofate-ui-tap", 0.17, paperRenderer(2_026_080_2, "tap"));
writeStereoWav("cofate-ui-confirm", 0.5, paperRenderer(2_026_081_7, "confirm"));
