import {
  animate,
  motionValue,
  type AnimationPlaybackControls,
  type MotionValue,
} from 'motion/react';

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
  private readonly waiting = new Map<string, { origin: Point; count: number }>();
  private capacity = 0;
  private paused = false;

  setCapacity(capacity: number) {
    this.capacity = capacity;
    this.drain();
  }

  send(origin: Point) {
    if (this.paused) return;
    if (this.active.size < this.capacity) {
      this.start(origin);
      return;
    }
    // Bursts at the same display pixel need one origin, even while all lanes are busy.
    const key = `${Math.round(origin.x)},${Math.round(origin.y)}`;
    const pending = this.waiting.get(key);
    if (pending) pending.count++;
    else this.waiting.set(key, { origin, count: 1 });
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    for (const { control } of this.active) {
      if (paused) control.pause();
      else control.play();
    }
    this.drain();
  }

  clear() {
    this.waiting.clear();
    for (const { control, progress } of this.active) {
      control.stop();
      progress.destroy();
    }
    this.active.clear();
  }

  private start(origin: Point) {
    const progress = motionValue(0);
    const control = animate(progress, 1, { duration: 2.6, ease: [0.25, 0.4, 0.45, 1] });
    const impulse = { ...origin, progress, control };
    this.active.add(impulse);
    void control.then(() => {
      if (!this.active.delete(impulse)) return;
      progress.destroy();
      this.drain();
    });
  }

  private drain() {
    while (!this.paused && this.active.size < this.capacity && this.waiting.size) {
      const [key, pending] = this.waiting.entries().next().value!;
      this.waiting.delete(key);
      if (--pending.count > 0) this.waiting.set(key, pending);
      this.start(pending.origin);
    }
  }
}
