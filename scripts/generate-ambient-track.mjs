import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "public/audio/cofate-night-loop.wav");
const sampleRate = 44_100;
const tempo = 80;
const beatsPerBar = 4;
const barSeconds = (60 / tempo) * beatsPerBar;
const barCount = 60;
const duration = barSeconds * barCount;
const frameCount = Math.round(sampleRate * duration);
const left = new Float32Array(frameCount);
const right = new Float32Array(frameCount);

function panGains(pan) {
  const angle = (Math.max(-1, Math.min(1, pan)) + 1) * Math.PI / 4;
  return [Math.cos(angle), Math.sin(angle)];
}

function wrappedIndex(index) {
  return ((index % frameCount) + frameCount) % frameCount;
}

function addTone({ start, length, frequency, amplitude, pan = 0, attack = 0.08, release = 0.8, character = "bell" }) {
  const first = Math.floor(start * sampleRate);
  const samples = Math.ceil(length * sampleRate);
  const [gainL, gainR] = panGains(pan);

  for (let offset = 0; offset < samples; offset += 1) {
    const index = wrappedIndex(first + offset);
    const time = offset / sampleRate;
    const remaining = length - time;
    const fadeIn = Math.min(1, time / Math.max(0.001, attack));
    const fadeOut = Math.min(1, remaining / Math.max(0.001, release));
    const envelope = Math.sin(Math.min(fadeIn, fadeOut) * Math.PI / 2) ** 2;
    const phase = Math.PI * 2 * frequency * time;
    let wave;

    if (character === "pad") {
      wave = Math.sin(phase) + 0.2 * Math.sin(phase * 2 + 0.31) + 0.07 * Math.sin(phase * 3.01 + 0.8);
    } else if (character === "glass") {
      const decay = Math.exp(-time * 1.22);
      wave = decay * (Math.sin(phase) + 0.29 * Math.sin(phase * 2.003 + 0.2) + 0.12 * Math.sin(phase * 4.01));
    } else {
      const decay = Math.exp(-time * 1.75);
      wave = decay * (Math.sin(phase) + 0.32 * Math.sin(phase * 2.01) + 0.13 * Math.sin(phase * 3.99));
    }

    const sample = wave * envelope * amplitude;
    left[index] += sample * gainL;
    right[index] += sample * gainR;
  }
}

function addPulse(start, amplitude = 0.045) {
  const first = Math.floor(start * sampleRate);
  const samples = Math.floor(sampleRate * 0.38);
  for (let offset = 0; offset < samples; offset += 1) {
    const index = wrappedIndex(first + offset);
    const time = offset / sampleRate;
    const frequency = 86 - 27 * Math.min(1, time / 0.24);
    const envelope = (1 - Math.exp(-time * 48)) * Math.exp(-time * 11);
    const sample = Math.sin(Math.PI * 2 * frequency * time) * envelope * amplitude;
    left[index] += sample * 0.7;
    right[index] += sample * 0.7;
  }
}

const chords = [
  [146.83, 174.61, 220, 329.63],
  [116.54, 146.83, 174.61, 220],
  [130.81, 164.81, 220, 261.63],
  [130.81, 196, 293.66, 329.63],
];

const sectionEnergy = (bar) => {
  if (bar < 8) return 0.64 + bar * 0.035;
  if (bar < 24) return 0.92;
  if (bar < 40) return 1.08;
  if (bar < 56) return 0.98;
  return 0.82 - (bar - 56) * 0.04;
};

// The first pad begins before zero and every write wraps around the buffer. The
// final chord tails therefore meet the opening attack without a silent seam.
for (let bar = 0; bar < barCount; bar += 1) {
  const chord = chords[bar % chords.length];
  const energy = sectionEnergy(bar);
  const start = bar * barSeconds - 0.18;

  chord.forEach((frequency, noteIndex) => {
    addTone({
      start,
      length: barSeconds + 0.72,
      frequency,
      amplitude: (0.031 - noteIndex * 0.003) * energy,
      pan: -0.58 + noteIndex * 0.38,
      attack: 0.72,
      release: 1.08,
      character: "pad",
    });
  });
}

const arpPattern = [0, 2, 1, 3, 2, 1, 3, 2];
for (let step = 0; step < barCount * 4; step += 1) {
  const bar = Math.floor(step / 4);
  const chord = chords[bar % chords.length];
  const energy = sectionEnergy(bar);
  const sparseIntro = bar < 4 && step % 2 === 1;
  const sparseOutro = bar >= 57 && step % 2 === 1;
  if (sparseIntro || sparseOutro) continue;

  const noteIndex = arpPattern[step % arpPattern.length];
  const octaveLift = bar >= 24 && bar < 48 && step % 8 === 7 ? 2 : 1;
  addTone({
    start: step * (barSeconds / 4) + 0.09,
    length: bar >= 40 ? 1.22 : 1.05,
    frequency: chord[noteIndex] * octaveLift,
    amplitude: 0.071 * energy,
    pan: step % 2 === 0 ? -0.42 : 0.42,
    attack: 0.018,
    release: 0.72,
    character: bar >= 40 ? "glass" : "bell",
  });

  if (bar >= 16 && bar < 52 && step % 4 === 0) {
    addPulse(step * (barSeconds / 4), bar >= 24 && bar < 40 ? 0.055 : 0.038);
  }
}

const melodyPhrases = [
  [440, 523.25, 587.33, 698.46, 659.25, 587.33, 523.25, 440],
  [392, 440, 523.25, 659.25, 587.33, 523.25, 493.88, 440],
  [523.25, 587.33, 698.46, 783.99, 698.46, 659.25, 587.33, 523.25],
  [440, 493.88, 587.33, 659.25, 587.33, 523.25, 493.88, 440],
];

for (let phrase = 0; phrase < 15; phrase += 1) {
  const phraseStart = phrase * 12;
  const notes = melodyPhrases[phrase % melodyPhrases.length];
  const energy = sectionEnergy(phrase * 4);

  notes.forEach((frequency, noteIndex) => {
    if ((phrase === 0 || phrase === 14) && noteIndex % 2 === 1) return;
    addTone({
      start: phraseStart + noteIndex * 1.5 + 0.4,
      length: noteIndex % 4 === 3 ? 1.78 : 1.18,
      frequency,
      amplitude: (noteIndex % 4 === 0 ? 0.083 : 0.065) * energy,
      pan: Math.sin((phrase * 8 + noteIndex) * 1.37) * 0.52,
      attack: 0.026,
      release: 0.84,
      character: phrase >= 10 ? "glass" : "bell",
    });
  });
}

// A circular stereo delay keeps the ambience continuous at the loop boundary.
const dryLeft = left.slice();
const dryRight = right.slice();
const delayA = Math.floor(sampleRate * 0.23);
const delayB = Math.floor(sampleRate * 0.41);
for (let index = 0; index < frameCount; index += 1) {
  left[index] += dryRight[wrappedIndex(index - delayA)] * 0.15;
  right[index] += dryLeft[wrappedIndex(index - delayA)] * 0.15;
  left[index] += dryLeft[wrappedIndex(index - delayB)] * 0.075;
  right[index] += dryRight[wrappedIndex(index - delayB)] * 0.075;
}

let peak = 0;
for (let index = 0; index < frameCount; index += 1) {
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
console.log(`${output} (${duration} seconds, seamless circular mix)`);
