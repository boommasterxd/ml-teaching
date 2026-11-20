import type { Page, Route } from '@playwright/test';

const modelDirectory = 'https://tfhub.dev/google/imagenet/mobilenet_v2_100_224/classification/2/';
const weightsFile = 'synthetic-weights.bin';
const modelFiles = new Map<string, 'graph' | 'weights'>([
  [`${modelDirectory}model.json?tfjs-format=file`, 'graph'],
  [`${modelDirectory}${weightsFile}?tfjs-format=file`, 'weights'],
]);
type ModelFile = 'graph' | 'weights';

/** Tiny isolated feature extractor; real TF graph parsing, WebGL and KNN remain active. */
const syntheticModel = {
  format: 'graph-model',
  generatedBy: 'ML Teaching synthetic browser fixture',
  convertedBy: 'ML Teaching synthetic browser fixture',
  modelTopology: {
    node: [
      {
        name: 'images',
        op: 'Placeholder',
        attr: {
          dtype: { type: 'DT_FLOAT' },
          shape: {
            shape: { dim: [{ size: '-1' }, { size: '224' }, { size: '224' }, { size: '3' }] },
          },
        },
      },
      {
        name: 'axes',
        op: 'Const',
        attr: {
          dtype: { type: 'DT_INT32' },
          value: {
            tensor: { dtype: 'DT_INT32', tensorShape: { dim: [{ size: '2' }] }, intVal: [1, 2] },
          },
        },
      },
      {
        name: 'module_apply_default/MobilenetV2/Logits/AvgPool',
        op: 'Mean',
        input: ['images', 'axes'],
        attr: { T: { type: 'DT_FLOAT' }, Tidx: { type: 'DT_INT32' }, keep_dims: { b: true } },
      },
    ],
    versions: { producer: 1, minConsumer: 0 },
  },
  weightsManifest: [
    { paths: [weightsFile], weights: [{ name: 'axes', shape: [2], dtype: 'int32' }] },
  ],
};

const cors = { 'access-control-allow-origin': '*' };

export async function routeSyntheticModel(
  page: Page,
  baseURL: string,
  respond: (route: Route, file: ModelFile) => void | Promise<void> = fulfillModelFile,
) {
  const expectedOrigin = new URL(baseURL).origin;
  const modelRequests: ModelFile[] = [];
  let unexpectedRequests = 0;
  await page.route(/^https?:\/\//, async (route) => {
    const request = route.request();
    const readsOnly = ['GET', 'HEAD'].includes(request.method()) && !request.postDataBuffer();
    if (readsOnly && new URL(request.url()).origin === expectedOrigin) {
      return route.continue();
    }
    const file = modelFiles.get(request.url());
    if (readsOnly && request.method() === 'GET' && file) {
      modelRequests.push(file);
      return respond(route, file);
    }
    // Never include an unexpected URL or body in the test output.
    unexpectedRequests++;
    await route.abort();
  });
  return { modelRequests, unexpectedRequests: () => unexpectedRequests };
}

export async function failSyntheticModel(route: Route) {
  await route.fulfill({ status: 503, headers: cors, json: { error: 'Synthetic model outage' } });
}

async function fulfillModelFile(route: Route, file: ModelFile) {
  if (file === 'graph') {
    await route.fulfill({ headers: cors, json: syntheticModel });
    return;
  }
  await route.fulfill({
    headers: cors,
    contentType: 'application/octet-stream',
    body: Buffer.from(new Int32Array([1, 2]).buffer),
  });
}
