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

function softEnvelope(time, duration, attack = 0.004) {
  const fadeIn = Math.min(1, time / attack);
  const fadeOut = Math.max(0, 1 - time / duration) ** 2.5;
  return Math.sin(fadeIn * Math.PI / 2) * fadeOut;
}

writeStereoWav("cofate-ui-tap", 0.12, (time) => {
  const envelope = softEnvelope(time, 0.12);
  const pitch = 880 + 90 * Math.exp(-time * 30);
  const phase = Math.PI * 2 * pitch * time;
  const tone = (Math.sin(phase) + 0.22 * Math.sin(phase * 2.01)) * envelope;
  return [tone * 0.92, tone];
});

writeStereoWav("cofate-ui-confirm", 0.34, (time) => {
  const firstEnvelope = softEnvelope(time, 0.2, 0.006);
  const firstPhase = Math.PI * 2 * 659.25 * time;
  const secondTime = Math.max(0, time - 0.105);
  const secondEnvelope = time >= 0.105 ? softEnvelope(secondTime, 0.235, 0.006) : 0;
  const secondPhase = Math.PI * 2 * 987.77 * secondTime;
  const left = Math.sin(firstPhase) * firstEnvelope * 0.72 + Math.sin(secondPhase) * secondEnvelope * 0.62;
  const right = Math.sin(firstPhase + 0.05) * firstEnvelope * 0.66 + Math.sin(secondPhase + 0.08) * secondEnvelope * 0.7;
  return [left, right];
});
