import type { Page, Request, Route } from '@playwright/test';
import siteConfig from '../../csp.config.mjs';
import { learningPaths } from '../../src/lib/learning-paths';

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

const flowDocuments = new Set<string>([
  '/',
  learningPaths.images,
  learningPaths.imagePractice,
  '/datenschutz',
]);
const assets =
  /^(?:\/_next\/static\/(?:chunks\/[\w./-]+\.(?:js|css)|media\/[\w.-]+\.(?:webp|woff2))|\/favicon\.svg|\/apple-icon\.png)$/;
const publicRoutes = new Set<string>(siteConfig.routes);

function blockedDestination(url: URL, origin: string) {
  if (url.origin !== origin) return 'external';
  if (publicRoutes.has(url.pathname) || url.pathname === '/_next/image') return url.pathname;
  return assets.test(url.pathname) ? 'static asset' : 'unlisted local path';
}

function isExpectedLocalRead(url: URL, request: Request) {
  const resourceType = request.resourceType();
  const query = url.searchParams;
  const isFlowDocument = flowDocuments.has(url.pathname);
  if (request.isNavigationRequest()) return isFlowDocument && query.size === 0;
  const isHubPrefetch =
    url.pathname === learningPaths.hub && request.headers()['next-router-prefetch'] === '1';
  if (isFlowDocument || isHubPrefetch) {
    if (request.headers().rsc !== '1') return false;
    return query.size === 0 || (query.size === 1 && /^[\w-]{1,16}$/.test(query.get('_rsc') ?? ''));
  }
  if (assets.test(url.pathname)) {
    return (
      query.size === 0 && ['script', 'stylesheet', 'font', 'image', 'other'].includes(resourceType)
    );
  }
  if (url.pathname !== '/_next/image' || resourceType !== 'image') return false;
  return (
    query.size === 3 &&
    /^\/_next\/static\/media\/[\w.-]+\.webp$/.test(query.get('url') ?? '') &&
    /^\d{1,4}$/.test(query.get('w') ?? '') &&
    /^\d{1,3}$/.test(query.get('q') ?? '')
  );
}

export async function routeSyntheticModel(
  page: Page,
  baseURL: string,
  modelUnavailable = () => false,
) {
  const expectedOrigin = new URL(baseURL).origin;
  const modelRequests: ModelFile[] = [];
  const unexpectedRequests: Array<{
    destination: string;
    method: string;
    resourceType: string;
    routeData: boolean;
    readsOnly: boolean;
  }> = [];
  await page.route(/^https?:\/\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const readsOnly = ['GET', 'HEAD'].includes(request.method()) && !request.postDataBuffer();
    if (readsOnly && url.origin === expectedOrigin && isExpectedLocalRead(url, request)) {
      return route.continue();
    }
    const file = modelFiles.get(request.url());
    if (readsOnly && request.method() === 'GET' && file) {
      modelRequests.push(file);
      if (modelUnavailable()) return route.fulfill({ status: 503, headers: cors });
      return fulfillModelFile(route, file);
    }
    // Report public route names and request metadata without URLs or bodies.
    unexpectedRequests.push({
      destination: blockedDestination(url, expectedOrigin),
      method: request.method(),
      resourceType: request.resourceType(),
      routeData: request.headers().rsc === '1',
      readsOnly,
    });
    await route.abort();
  });
  return { modelRequests, unexpectedRequests };
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
