export const MIN_DURATION_SECONDS = 0;
export const MAX_DURATION_SECONDS = 10;
export const DURATION_STEP_SECONDS = 0.1;
export const DURATION_INPUT_STEP_SECONDS = 0.01;
export const DEFAULT_FRAME_DURATION_SECONDS = 0.1;
const SANITIZE_PRECISION = 100;

export function sanitizeDuration(value: number) {
  if (!Number.isFinite(value)) {
    return MIN_DURATION_SECONDS;
  }
  const clamped = Math.min(Math.max(value, MIN_DURATION_SECONDS), MAX_DURATION_SECONDS);
  return Math.round(clamped * SANITIZE_PRECISION) / SANITIZE_PRECISION;
}

export function defaultDurationForFrames(frameCount: number) {
  const baseCount = frameCount > 0 ? frameCount : 1;
  const rawDuration = baseCount * DEFAULT_FRAME_DURATION_SECONDS;
  return sanitizeDuration(rawDuration);
}
