import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public/audio/cofate-night-loop.wav");
const sampleRate = 44_100;
const duration = 24;
const frameCount = sampleRate * duration;
const left = new Float32Array(frameCount);
const right = new Float32Array(frameCount);

function panGains(pan) {
  const angle = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4;
  return [Math.cos(angle), Math.sin(angle)];
}

function addTone({ start, length, frequency, amplitude, pan = 0, attack = 0.08, release = 0.8, character = "bell" }) {
  const first = Math.max(0, Math.floor(start * sampleRate));
  const last = Math.min(frameCount, Math.ceil((start + length) * sampleRate));
  const [gainL, gainR] = panGains(pan);
  for (let index = first; index < last; index += 1) {
    const time = index / sampleRate - start;
    const remaining = length - time;
    const fadeIn = Math.min(1, time / Math.max(0.001, attack));
    const fadeOut = Math.min(1, remaining / Math.max(0.001, release));
    const envelope = Math.sin(Math.min(fadeIn, fadeOut) * Math.PI / 2) ** 2;
    const phase = Math.PI * 2 * frequency * time;
    let wave;
    if (character === "pad") {
      wave = Math.sin(phase) + 0.22 * Math.sin(phase * 2 + 0.3) + 0.08 * Math.sin(phase * 3.01);
    } else {
      const decay = Math.exp(-time * 1.7);
      wave = decay * (Math.sin(phase) + 0.34 * Math.sin(phase * 2.01) + 0.15 * Math.sin(phase * 3.99));
    }
    const sample = wave * envelope * amplitude;
    left[index] += sample * gainL;
    right[index] += sample * gainR;
  }
}

function addPulse(start) {
  const first = Math.floor(start * sampleRate);
  const last = Math.min(frameCount, first + Math.floor(sampleRate * 0.42));
  for (let index = first; index < last; index += 1) {
    const time = (index - first) / sampleRate;
    const frequency = 92 - 35 * Math.min(1, time / 0.24);
    const envelope = (1 - Math.exp(-time * 45)) * Math.exp(-time * 9.5);
    const sample = Math.sin(Math.PI * 2 * frequency * time) * envelope * 0.085;
    left[index] += sample * 0.7;
    right[index] += sample * 0.7;
  }
}

const chords = [
  [146.83, 174.61, 220.0, 329.63],
  [116.54, 146.83, 174.61, 220.0],
  [130.81, 164.81, 220.0, 261.63],
  [130.81, 196.0, 293.66, 329.63],
];

chords.forEach((chord, chordIndex) => {
  const start = chordIndex * 6;
  chord.forEach((frequency, noteIndex) => {
    addTone({
      start: Math.max(0, start - 0.25),
      length: 6.5,
      frequency,
      amplitude: 0.038 - noteIndex * 0.004,
      pan: -0.55 + noteIndex * 0.36,
      attack: 0.85,
      release: 1.1,
      character: "pad",
    });
  });
});

for (let step = 0; step < 32; step += 1) {
  const chord = chords[Math.floor(step / 8)];
  const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
  const frequency = chord[pattern[step % pattern.length]] * (step % 8 === 7 ? 2 : 1);
  addTone({
    start: step * 0.75 + 0.08,
    length: 1.25,
    frequency,
    amplitude: 0.095,
    pan: step % 2 === 0 ? -0.38 : 0.38,
    attack: 0.018,
    release: 0.72,
  });
  if (step % 4 === 0) addPulse(step * 0.75);
}

const melody = [
  440, 523.25, 587.33, 698.46,
  659.25, 587.33, 523.25, 440,
  392, 440, 523.25, 659.25,
  587.33, 523.25, 493.88, 440,
];

melody.forEach((frequency, index) => {
  addTone({
    start: index * 1.5 + 0.42,
    length: index % 4 === 3 ? 1.7 : 1.15,
    frequency,
    amplitude: index % 4 === 0 ? 0.105 : 0.082,
    pan: Math.sin(index * 1.7) * 0.55,
    attack: 0.025,
    release: 0.82,
  });
});

const delayA = Math.floor(sampleRate * 0.23);
const delayB = Math.floor(sampleRate * 0.41);
for (let index = 0; index < frameCount; index += 1) {
  if (index >= delayA) {
    left[index] += right[index - delayA] * 0.16;
    right[index] += left[index - delayA] * 0.16;
  }
  if (index >= delayB) {
    left[index] += left[index - delayB] * 0.08;
    right[index] += right[index - delayB] * 0.08;
  }
}

let peak = 0;
for (let index = 0; index < frameCount; index += 1) {
  const edgeFade = Math.min(1, index / (sampleRate * 0.32), (frameCount - index - 1) / (sampleRate * 0.42));
  left[index] *= Math.max(0, edgeFade);
  right[index] *= Math.max(0, edgeFade);
  peak = Math.max(peak, Math.abs(left[index]), Math.abs(right[index]));
}

const scale = peak > 0 ? 0.86 / peak : 1;
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

for (let index = 0; index < frameCount; index += 1) {
  const offset = 44 + index * 4;
  wav.writeInt16LE(Math.max(-32_768, Math.min(32_767, Math.round(left[index] * scale * 32_767))), offset);
  wav.writeInt16LE(Math.max(-32_768, Math.min(32_767, Math.round(right[index] * scale * 32_767))), offset + 2);
}

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, wav);
console.log(output);
