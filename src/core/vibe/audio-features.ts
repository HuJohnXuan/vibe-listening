export interface AudioFeatures { bpm: number | null; confidence: number; rms: number; seconds: number; }
/** Amplitude-onset autocorrelation, not genre/emotion recognition. */
export function estimateAudioFeatures(samples: Float32Array, sampleRate: number): AudioFeatures {
  const hop = Math.max(1, Math.floor(sampleRate / 100));
  const frames = Math.floor(Math.min(samples.length, sampleRate * 90) / hop);
  const onsets = new Float32Array(frames);
  let total = 0, previous = 0;
  for (let frame = 0; frame < frames; frame++) {
    let sum = 0;
    for (let j = 0; j < hop; j++) sum += samples[frame * hop + j] ** 2;
    total += sum;
    const rms = Math.sqrt(sum / hop);
    onsets[frame] = Math.max(0, rms - previous); previous = rms;
  }
  let best = 0, lagBest = 0;
  for (let lag = 33; lag <= 100 && lag < frames / 3; lag++) {
    let cross = 0, a = 0, b = 0;
    for (let i = lag; i < frames; i++) { cross += onsets[i] * onsets[i - lag]; a += onsets[i] ** 2; b += onsets[i - lag] ** 2; }
    const correlation = a && b ? cross / Math.sqrt(a * b) : 0;
    if (correlation > best) { best = correlation; lagBest = lag; }
  }
  return { bpm: best >= 0.3 && frames >= 800 ? Math.round(6000 / lagBest) : null, confidence: best,
    rms: frames ? Math.sqrt(total / (frames * hop)) : 0, seconds: frames / 100 };
}
