import type { MLClass } from '../types/ml';

export interface ProjectedPosition {
  x: number;
  y: number;
}

export interface ProjectedExample extends ProjectedPosition {
  classId: string;
}

export interface FeatureProjection {
  points: readonly ProjectedExample[];
  project(features: ArrayLike<number>): ProjectedPosition;
}

const fitIterations = 8;
const fitSliceMs = 5;
const minimumVariance = 1e-10;

function dot(left: ArrayLike<number>, right: ArrayLike<number>): number {
  let total = 0;
  for (let column = 0; column < left.length; column++) total += left[column] * right[column];
  return total;
}

function inverseLength(vector: ArrayLike<number>): number {
  const length = Math.sqrt(dot(vector, vector));
  return length > 0 ? 1 / length : 0;
}

function createFitSchedule(signal: AbortSignal) {
  let deadline = performance.now() + fitSliceMs;
  return async (length: number, visit: (index: number) => void) => {
    signal.throwIfAborted();
    for (let index = 0; index < length; index++) {
      visit(index);
      if (index % 32 === 31 && performance.now() >= deadline) {
        // Leave room for video decoding, input and live inference on the same thread.
        await new Promise<void>((resume) => setTimeout(resume, 0));
        signal.throwIfAborted();
        deadline = performance.now() + fitSliceMs;
      }
    }
  };
}

type FitSchedule = ReturnType<typeof createFitSchedule>;

async function centerFeatures(features: readonly number[][], eachRow: FitSchedule) {
  const columns = features[0]?.length ?? 0;
  const values = new Float32Array(features.length * columns);
  const mean = new Float64Array(columns);
  await eachRow(features.length, (row) => {
    const vector = features[row];
    if (vector.length !== columns) throw new RangeError('Inconsistent image feature dimensions.');
    const multiplier = inverseLength(vector);
    const start = row * columns;
    for (let column = 0; column < columns; column++) {
      values[start + column] = vector[column] * multiplier;
      mean[column] += values[start + column];
    }
  });
  for (let column = 0; column < columns; column++) mean[column] /= features.length;
  await eachRow(features.length, (row) => {
    const start = row * columns;
    for (let column = 0; column < columns; column++) values[start + column] -= mean[column];
  });
  return { values, mean, rows: features.length, columns };
}

type CenteredFeatures = Awaited<ReturnType<typeof centerFeatures>>;

/** Apply XᵀX to one vector without allocating the full feature covariance matrix. */
async function covarianceTimesAxis(
  features: CenteredFeatures,
  axis: Float64Array,
  product: Float64Array,
  eachRow: FitSchedule,
) {
  const { values, rows, columns } = features;
  product.fill(0);
  await eachRow(rows, (row) => {
    const start = row * columns;
    let score = 0;
    for (let column = 0; column < columns; column++) score += values[start + column] * axis[column];
    for (let column = 0; column < columns; column++)
      product[column] += values[start + column] * score;
  });
}

function seedAxis(columns: number, seed: number) {
  // Dense reproducible seeds allow the fitter to discover axes across all feature dimensions.
  return Float64Array.from({ length: columns }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296 - 0.5;
  });
}

async function principalAxis(
  features: CenteredFeatures,
  eachRow: FitSchedule,
  previous?: Float64Array,
): Promise<Float64Array> {
  const { columns } = features;
  let axis = seedAxis(columns, previous ? 2 : 1);
  let product = new Float64Array(columns);
  for (let iteration = 0; iteration < fitIterations; iteration++) {
    await covarianceTimesAxis(features, axis, product, eachRow);
    if (previous) {
      const overlap = dot(product, previous);
      for (let column = 0; column < columns; column++)
        product[column] -= overlap * previous[column];
    }
    const magnitude = Math.sqrt(dot(product, product));
    if (magnitude < minimumVariance) return product.fill(0);
    for (let column = 0; column < columns; column++) product[column] /= magnitude;
    [axis, product] = [product, axis];
  }
  return axis;
}

function createProjector(mean: Float64Array, xAxis: Float64Array, yAxis: Float64Array) {
  const xCenter = dot(mean, xAxis);
  const yCenter = dot(mean, yAxis);
  return (features: ArrayLike<number>): ProjectedPosition => {
    if (features.length !== mean.length)
      throw new RangeError('Unexpected image feature dimensions.');
    const multiplier = inverseLength(features);
    return {
      x: dot(features, xAxis) * multiplier - xCenter,
      y: dot(features, yAxis) * multiplier - yCenter,
    };
  };
}

/** Fit two principal axes of unit-normalized MobileNet features for visualization. */
export async function fitFeatureProjection(
  classes: readonly MLClass[],
  signal: AbortSignal,
): Promise<FeatureProjection> {
  signal.throwIfAborted();
  const examples = classes.flatMap(({ id, images }) =>
    images.map(({ featureArray }) => ({ classId: id, features: featureArray })),
  );
  const eachRow = createFitSchedule(signal);
  const centered = await centerFeatures(
    examples.map(({ features }) => features),
    eachRow,
  );
  const xAxis = await principalAxis(centered, eachRow);
  const yAxis = await principalAxis(centered, eachRow, xAxis);
  const project = createProjector(centered.mean, xAxis, yAxis);
  const points: ProjectedExample[] = [];
  await eachRow(examples.length, (row) => {
    const { features, classId } = examples[row];
    points.push({ ...project(features), classId });
  });
  return { points, project };
}
