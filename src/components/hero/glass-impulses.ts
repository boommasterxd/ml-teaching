import {
  animate,
  motionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react';

const impulseDurationMs = 2_600;
const maxWaitingImpulses = 16;
const maxWaitMs = 3 * impulseDurationMs;

interface Point {
  x: number;
  y: number;
}

interface Impulse extends Point {
  progress: MotionValue<number>;
  control: AnimationPlaybackControls;
}

export class GlassImpulses {
  readonly active = new Set<Impulse>();
  private readonly waiting = new Map<string, { origin: Point; times: number[] }>();
  private waitingCount = 0;
  private capacity = 0;
  private pausedAt: number | undefined;
  private timePaused = 0;

  setCapacity(capacity: number) {
    this.capacity = capacity;
    this.drain();
  }

  send(origin: Point) {
    if (this.pausedAt !== undefined) return;
    if (this.active.size < this.capacity) {
      this.start(origin);
      return;
    }
    const queuedAt = this.playbackTime();
    if (this.waitingCount === maxWaitingImpulses) this.discardExpired(queuedAt);
    if (this.waitingCount === maxWaitingImpulses) return;

    // Bursts at the same display pixel need one origin, even while all lanes are busy.
    const key = `${Math.round(origin.x)},${Math.round(origin.y)}`;
    const pending = this.waiting.get(key);
    if (pending) pending.times.push(queuedAt);
    else this.waiting.set(key, { origin, times: [queuedAt] });
    this.waitingCount++;
  }

  setPaused(paused: boolean) {
    if (paused === (this.pausedAt !== undefined)) return;
    const now = performance.now();
    if (this.pausedAt !== undefined) this.timePaused += now - this.pausedAt;
    this.pausedAt = paused ? now : undefined;
    for (const { control } of this.active) {
      if (paused) control.pause();
      else control.play();
    }
    this.drain();
  }

  clear() {
    this.waiting.clear();
    this.waitingCount = 0;
    for (const { control, progress } of this.active) {
      control.stop();
      progress.destroy();
    }
    this.active.clear();
  }

  private start(origin: Point) {
    const progress = motionValue(0);
    const control = animate(progress, 1, {
      duration: impulseDurationMs / 1_000,
      ease: [0.25, 0.4, 0.45, 1],
    });
    const impulse = { ...origin, progress, control };
    this.active.add(impulse);
    void control.then(() => {
      if (!this.active.delete(impulse)) return;
      progress.destroy();
      this.drain();
    });
  }

  private playbackTime() {
    return performance.now() - this.timePaused;
  }

  private discardExpired(now: number) {
    const cutoff = now - maxWaitMs;
    for (const [key, { times }] of this.waiting) {
      while (times.length && times[0]! <= cutoff) {
        times.shift();
        this.waitingCount--;
      }
      if (times.length === 0) this.waiting.delete(key);
    }
  }

  private drain() {
    if (this.pausedAt !== undefined || this.waitingCount === 0 || this.active.size >= this.capacity)
      return;
    this.discardExpired(this.playbackTime());
    while (this.active.size < this.capacity && this.waitingCount > 0) {
      const [key, pending] = this.waiting.entries().next().value!;
      this.waiting.delete(key);
      pending.times.shift();
      this.waitingCount--;
      if (pending.times.length > 0) this.waiting.set(key, pending);
      this.start(pending.origin);
    }
  }
}
