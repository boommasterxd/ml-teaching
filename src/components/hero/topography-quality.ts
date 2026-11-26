export interface TopographyQuality {
  readonly dpr: number;
  readonly rasterPixels: number;
  readonly fieldScale: number;
  readonly fieldTexels: number;
}

const qualityLevels: readonly TopographyQuality[] = [
  // Keep a low-cost tier for recovery artwork and constrained devices.
  { dpr: 0.5, rasterPixels: 100_000, fieldScale: 0.4, fieldTexels: 16_000 },
  { dpr: 0.8, rasterPixels: 256_000, fieldScale: 0.65, fieldTexels: 40_000 },
  { dpr: 1.5, rasterPixels: 2_073_600, fieldScale: 1, fieldTexels: 150_000 },
  { dpr: 2, rasterPixels: 4_147_200, fieldScale: 1.35, fieldTexels: 300_000 },
  { dpr: 3, rasterPixels: 8_294_400, fieldScale: 1.7, fieldTexels: 600_000 },
];

const SAMPLE_MS = 1000;
const STARTUP_PROMOTION_MS = 300;
const SLOW_FRAME_MS = 1000 / 27;
const FAST_FRAME_MS = 1000 / 48;
const RECOVERY_WINDOWS = 6;

const startupProfiles = {
  standard: { initial: 0, earlyTarget: 0 },
  'home-mobile': { initial: 2, earlyTarget: 2 },
  'home-desktop': { initial: 3, earlyTarget: 4 },
} as const;

/** Adjust both passes using sustained frame cadence. */
export function createTopographyQuality(startup: keyof typeof startupProfiles) {
  const { initial: startLevel, earlyTarget } = startupProfiles[startup];
  let level = startLevel;
  let startupEligible = startLevel < earlyTarget;
  let promotionWindows = 1;
  let baselineFrameMs = FAST_FRAME_MS;
  let previous: number | undefined;
  let elapsed = 0;
  let intervals = 0;
  let slow = 0;
  let healthyWindows = 0;

  const resetSamples = () => {
    previous = undefined;
    elapsed = 0;
    intervals = 0;
    slow = 0;
    healthyWindows = 0;
  };

  return {
    get current() {
      return qualityLevels[level]!;
    },
    resetSamples,
    sample(timestamp: number) {
      const slowFrameMs = Math.max(SLOW_FRAME_MS, baselineFrameMs * 1.5);
      const delta = timestamp - (previous ?? timestamp);
      previous = timestamp;
      elapsed += delta;
      intervals += Number(delta > 0);
      slow += Number(delta > slowFrameMs);
      const completeWindow = elapsed >= SAMPLE_MS;
      const startupPromotion =
        startupEligible &&
        level < earlyTarget &&
        elapsed >= (level - startLevel + 1) * STARTUP_PROMOTION_MS;
      if (!completeWindow && !startupPromotion) return false;

      const average = elapsed / intervals;
      // Learn the display cadence at startup and after a reduction, including steady 30 Hz.
      if (level <= startLevel && slow === 0) baselineFrameMs = Math.min(1000 / 30, average);
      const overloaded = slow >= 2 && (slow * 5 >= intervals || average > slowFrameMs);
      const healthy = slow === 0 && average < Math.max(FAST_FRAME_MS, baselineFrameMs * 1.25);
      if (!completeWindow) {
        if (!healthy) return false;
        // Preserve the full measurement window for detecting sustained load.
        level++;
        return true;
      }
      elapsed = intervals = slow = 0;
      healthyWindows = healthy ? healthyWindows + 1 : 0;
      if (overloaded) startupEligible = false;
      if (overloaded && level > 0) {
        level--;
        promotionWindows = RECOVERY_WINDOWS;
      } else if (healthyWindows >= promotionWindows && level < qualityLevels.length - 1) {
        level++;
        promotionWindows = 1;
      } else {
        return false;
      }
      healthyWindows = 0;
      return true;
    },
  };
}
