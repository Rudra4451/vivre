import fs from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 44100;

/**
 * Creates a valid 16-bit PCM Mono WAV buffer from float samples (-1.0 to 1.0)
 */
function createWavBuffer(samples) {
  const numSamples = samples.length;
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // RIFF identifier
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write("WAVE", 8);

  // format subchunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1 for Mono)
  buffer.writeUInt32LE(SAMPLE_RATE, 24); // SampleRate
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  // Write samples
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.floor(val), 44 + i * 2);
  }

  return buffer;
}

/**
 * Synthesizes harmonic celestial tones with exponential decay and warm overtones
 */
function synthesizeCelestial({
  duration = 0.5,
  harmonics = [{ freq: 440, gain: 0.5, delay: 0 }],
  decayRate = 6,
  attackTime = 0.015,
}) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let sample = 0;

    for (const h of harmonics) {
      if (t < h.delay) continue;
      const noteT = t - h.delay;
      // Smooth attack envelope
      const attack = noteT < attackTime ? noteT / attackTime : 1.0;
      // Warm exponential decay
      const decay = Math.exp(-decayRate * noteT);
      const envelope = attack * decay;

      // Pure sine fundamental + faint warm 2nd harmonic
      const fundamental = Math.sin(2 * Math.PI * h.freq * noteT);
      const overtone = 0.25 * Math.sin(2 * Math.PI * (h.freq * 2) * noteT);
      const sub = 0.15 * Math.sin(2 * Math.PI * (h.freq * 0.5) * noteT);

      sample += (fundamental + overtone + sub) * h.gain * envelope;
    }

    samples[i] = sample;
  }

  // Normalize to prevent clipping (peak 0.85)
  let max = 0;
  for (let i = 0; i < numSamples; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > max) max = abs;
  }
  if (max > 0) {
    const normFactor = 0.82 / max;
    for (let i = 0; i < numSamples; i++) {
      samples[i] *= normFactor;
    }
  }

  return samples;
}

// 1. Completion: Restrained starlight double-tone
const completionSamples = synthesizeCelestial({
  duration: 0.45,
  decayRate: 7.5,
  attackTime: 0.012,
  harmonics: [
    { freq: 739.99, gain: 0.5, delay: 0 },       // F#5
    { freq: 1108.73, gain: 0.4, delay: 0.04 },   // C#6
  ],
});

// 2. Bonus: Crystalline celestial twinkle
const bonusSamples = synthesizeCelestial({
  duration: 0.55,
  decayRate: 6.5,
  attackTime: 0.01,
  harmonics: [
    { freq: 830.61, gain: 0.4, delay: 0 },       // G#5
    { freq: 1046.50, gain: 0.4, delay: 0.035 },  // C6
    { freq: 1318.51, gain: 0.35, delay: 0.07 },  // E6
  ],
});

// 3. Critical: Resonant golden Solfeggio triad
const criticalSamples = synthesizeCelestial({
  duration: 0.8,
  decayRate: 5.0,
  attackTime: 0.015,
  harmonics: [
    { freq: 528.00, gain: 0.45, delay: 0 },      // 528 Hz
    { freq: 660.00, gain: 0.4, delay: 0.03 },    // 660 Hz
    { freq: 792.00, gain: 0.35, delay: 0.06 },   // 792 Hz
    { freq: 1056.00, gain: 0.25, delay: 0.09 },  // 1056 Hz
  ],
});

// 4. Level-Up: Grand celestial ascension chord
const levelUpSamples = synthesizeCelestial({
  duration: 1.8,
  decayRate: 2.8,
  attackTime: 0.02,
  harmonics: [
    { freq: 220.00, gain: 0.3, delay: 0 },       // A3 warm anchor
    { freq: 440.00, gain: 0.4, delay: 0 },       // A4
    { freq: 554.37, gain: 0.35, delay: 0.06 },   // C#5
    { freq: 659.25, gain: 0.35, delay: 0.12 },   // E5
    { freq: 830.61, gain: 0.3, delay: 0.18 },    // G#5
    { freq: 1108.73, gain: 0.25, delay: 0.24 },  // C#6
  ],
});

// 5. Shield: Warm protective harmonic resonance
const shieldSamples = synthesizeCelestial({
  duration: 0.9,
  decayRate: 4.2,
  attackTime: 0.025,
  harmonics: [
    { freq: 329.63, gain: 0.45, delay: 0 },      // E4
    { freq: 440.00, gain: 0.4, delay: 0.08 },    // A4
    { freq: 659.25, gain: 0.25, delay: 0.15 },   // E5
  ],
});

// 6. Purchase: Cartographic astral gear chime
const purchaseSamples = synthesizeCelestial({
  duration: 0.5,
  decayRate: 7.0,
  attackTime: 0.01,
  harmonics: [
    { freq: 932.33, gain: 0.5, delay: 0 },       // A#5
    { freq: 1396.91, gain: 0.4, delay: 0.04 },   // F6
  ],
});

const outDir = path.resolve(process.cwd(), "public", "sounds");
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, "completion.wav"), createWavBuffer(completionSamples));
fs.writeFileSync(path.join(outDir, "bonus.wav"), createWavBuffer(bonusSamples));
fs.writeFileSync(path.join(outDir, "critical.wav"), createWavBuffer(criticalSamples));
fs.writeFileSync(path.join(outDir, "level-up.wav"), createWavBuffer(levelUpSamples));
fs.writeFileSync(path.join(outDir, "shield.wav"), createWavBuffer(shieldSamples));
fs.writeFileSync(path.join(outDir, "purchase.wav"), createWavBuffer(purchaseSamples));

console.log("Successfully generated all 6 celestial audio assets in public/sounds/");
