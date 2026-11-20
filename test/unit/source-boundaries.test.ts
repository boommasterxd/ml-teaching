import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkSourceBoundaries } from '../../scripts/check-source-boundaries.ts';
import { ESLint } from 'eslint';

const fixtures: string[] = [];
const boundaryCommand = join(process.cwd(), 'scripts/check-source-boundaries.ts');

function sourceFixture(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'ml-teaching-boundaries-'));
  fixtures.push(root);
  for (const [name, source] of Object.entries({
    'tsconfig.json': JSON.stringify({
      compilerOptions: { paths: { '@/*': ['./src/*'] }, moduleResolution: 'bundler' },
    }),
    ...files,
  })) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, source);
  }
  return root;
}

function expectCliFailure(root: string, message: string) {
  const result = spawnSync(process.execPath, [boundaryCommand], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10_000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain(message);
}

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('Server Component and ML import boundaries', () => {
  it('enforces the separate ESLint route gate and disallows inline suppression', async () => {
    const lint = new ESLint();
    for (const entry of ['page.tsx', 'page.dev.ts', 'layout.dev.ts']) {
      const options = { filePath: `src/app/group/nested/${entry}` };
      const [client] = await lint.lintText(
        "/* eslint-disable architecture/server-routes */\n'use client'; export default function Page(){ return null }",
        options,
      );
      expect(
        client.messages.some(
          (message) => message.ruleId === 'architecture/server-routes' && message.severity === 2,
        ),
      ).toBe(true);
      const [server] = await lint.lintText(
        "const note = 'use client'; export default function Page(){ return note }",
        options,
      );
      expect(
        server.messages.filter((message) => message.ruleId === 'architecture/server-routes'),
      ).toEqual([]);
    }
  });
  it('accepts type-only ML imports and stops at an explicit browser leaf', () => {
    const root = sourceFixture({
      'src/app/page.tsx':
        "import type { Tensor } from '@tensorflow/tfjs-core'; import Client from '@/ui'; export default function Page(){ return <Client/> }",
      'src/ui.tsx':
        "'use client'; import('@tensorflow/tfjs-core'); export default function Client(){ return <button>Train</button> }",
    });
    expect(checkSourceBoundaries(root)).toEqual([]);
  });

  it('rejects nested client routes, including directives after comments', () => {
    const root = sourceFixture({
      'src/app/group/nested/page.tsx':
        "/* note */ 'use client'; export default function Page(){ return null }",
    });
    expect(
      checkSourceBoundaries(root).some((message: string) => message.includes('Server Component')),
    ).toBe(true);
    expectCliFailure(root, 'Server Component');
  });

  it('follows alias reexports to detect ML code in a server route', () => {
    const root = sourceFixture({
      'src/app/page.tsx':
        "// 'use client' is not a directive\nimport { train } from '@/barrel'; export default function Page(){ return null }",
      'src/barrel.ts': "export { train } from './train';",
      'src/train.ts': "import '@tensorflow/tfjs-core'; export const train = true;",
    });
    expect(
      checkSourceBoundaries(root).some((message: string) =>
        message.includes('Server imports browser code'),
      ),
    ).toBe(true);
  });

  it('rejects client imports of server-only code and unresolved dynamic imports', () => {
    const root = sourceFixture({
      'src/app/page.tsx':
        "import Client from '@/ui'; export default function Page(){ return <Client/> }",
      'src/ui.tsx':
        "'use client'; import '@/secret'; export default function Client(){ return null }",
      'src/secret.ts': "import 'server-only'; export const secret = 'synthetic';",
    });
    expect(
      checkSourceBoundaries(root).some((message: string) =>
        message.includes('Client imports server code'),
      ),
    ).toBe(true);
    writeFileSync(
      join(root, 'src/ui.tsx'),
      "'use client'; const name = 'dynamic'; import(name); export default function Client(){ return null }",
    );
    expect(checkSourceBoundaries(root).length).toBeGreaterThan(0);
  });

  it('rejects local runtime imports outside src while retaining native configuration', () => {
    const root = sourceFixture({
      'src/app/page.tsx':
        "import '../../outside.mjs'; export default function Page(){ return null }",
      'outside.mjs': "import '@tensorflow/tfjs-core';",
      'next.config.mjs': "import adapter from './csp/adapter.mjs'; export default { adapter };",
      'csp/adapter.mjs': 'export default {};',
    });
    expect(checkSourceBoundaries(root).some((message) => message.includes('outside src'))).toBe(
      true,
    );
    writeFileSync(
      join(root, 'src/app/page.tsx'),
      "import { value } from '../server/helper'; export default function Page(){ return <p>{value}</p> }",
    );
    mkdirSync(join(root, 'src/server'), { recursive: true });
    writeFileSync(join(root, 'src/server/helper.ts'), 'export const value = 1;');
    expect(checkSourceBoundaries(root)).toEqual([]);
  });

  it('checks every native static-error entry as a server import root', () => {
    const root = sourceFixture({
      'src/app/page.tsx': 'export default function Page(){ return null }',
    });
    mkdirSync(join(root, 'src/pages'), { recursive: true });
    for (const entry of ['500', '_app', '_document']) {
      const file = join(root, `src/pages/${entry}.tsx`);
      writeFileSync(
        file,
        "import '@tensorflow/tfjs-core'; export default function ErrorPage(){ return null }",
      );
      expect(
        checkSourceBoundaries(root).some((message) =>
          message.includes('Server imports browser code'),
        ),
      ).toBe(true);
      writeFileSync(file, 'export default function ErrorPage(){ return null }');
    }
    expect(checkSourceBoundaries(root)).toEqual([]);
    writeFileSync(
      join(root, 'src/pages/500.tsx'),
      "'use client'; import '@tensorflow/tfjs-core'; export default function ErrorPage(){ return null }",
    );
    expect(checkSourceBoundaries(root).some((message) => message.includes('server-rendered'))).toBe(
      true,
    );
  });
});

describe('compound development route extensions', () => {
  it('discovers real dev entries while preserving browser-only helper boundaries', () => {
    const entries = {
      'src/app/page.dev.ts':
        "import type { Tensor } from '@tensorflow/tfjs-core'; import { createElement } from 'react'; import Client from '@/client'; export default function Page(){ return createElement(Client) }",
      'src/app/layout.dev.ts':
        "import { createElement, type ReactNode } from 'react'; export default function Layout({children}: {children: ReactNode}){ return createElement('html', {lang: 'de'}, createElement('body', null, children)) }",
      'src/app/api/health/route.dev.ts':
        'export function GET(){ return new Response("synthetic") }',
      'src/app/robots.dev.ts': 'export default function robots(){ return { rules: [] } }',
      'src/pages/500.dev.ts': 'export default function ErrorPage(){ return null }',
    };
    const root = sourceFixture({
      ...entries,
      'src/client.ts':
        "'use client'; import './helper.dev'; export default function Client(){ return null }",
      'src/helper.dev.ts': "export const loadRuntime = () => import('@tensorflow/tfjs-core');",
    });
    expect(checkSourceBoundaries(root)).toEqual([]);
    for (const [entry, source] of Object.entries(entries)) {
      const file = join(root, entry);
      writeFileSync(file, `import '@tensorflow/tfjs-core';\n${source}`);
      expect(
        checkSourceBoundaries(root).some((message) =>
          message.includes('Server imports browser code'),
        ),
      ).toBe(true);
      writeFileSync(file, source);
    }
  });

  it('rejects client directives in compound dev pages, layouts and server-only entries', () => {
    const root = sourceFixture({
      'src/app/page.dev.ts': 'export default function Page(){ return null }',
      'src/app/nested/layout.dev.ts': 'export default function Layout(){ return null }',
      'src/app/robots.dev.ts': 'export default function robots(){ return { rules: [] } }',
    });
    for (const entry of ['page.dev.ts', 'nested/layout.dev.ts', 'robots.dev.ts']) {
      const file = join(root, 'src/app', entry);
      writeFileSync(
        file,
        "/* directive */ 'use client'; export default function Entry(){ return null }",
      );
      expect(checkSourceBoundaries(root).some((message) => message.includes('must remain'))).toBe(
        true,
      );
      expectCliFailure(root, 'must remain');
      writeFileSync(file, 'export default function Entry(){ return null }');
    }
  });
});

describe('native metadata entry boundaries', () => {
  it('checks metadata and routes without treating ordinary helpers as server roots', () => {
    const root = sourceFixture({
      'src/app/page.tsx': 'export default function Page(){ return null }',
      'src/app/robots.ts':
        'export default function robots(){ return { rules: { userAgent: "*", allow: "/" } } }',
      'src/app/sitemap.ts': 'export default function sitemap(){ return [] }',
      'src/app/opengraph-image.tsx':
        'export default function Image(){ return new Response("synthetic") }',
      'src/app/client.tsx':
        "'use client'; import './browser-helper'; export default function Client(){ return null }",
      'src/app/browser-helper.ts': "import '@tensorflow/tfjs-core';",
    });
    expect(checkSourceBoundaries(root)).toEqual([]);
    for (const entry of ['robots.ts', 'sitemap.ts', 'opengraph-image.tsx', 'route.ts']) {
      const file = join(root, 'src/app', entry);
      writeFileSync(
        file,
        "import '@tensorflow/tfjs-core'; export default function Entry(){ return null }",
      );
      expect(
        checkSourceBoundaries(root).some((message) =>
          message.includes('Server imports browser code'),
        ),
      ).toBe(true);
      writeFileSync(file, 'export default function Entry(){ return null }');
    }
    writeFileSync(
      join(root, 'src/app/robots.ts'),
      "'use client'; export default function robots(){ return {} }",
    );
    expect(
      checkSourceBoundaries(root).some((message) => message.includes('Server-only route entry')),
    ).toBe(true);
  });
});

describe('development-only native Proxy boundaries', () => {
  it('permits only the canonical CSP modules from the native Proxy entrypoint', () => {
    const root = sourceFixture({
      'src/app/page.tsx': 'export default function Page(){ return null }',
      'src/proxy.dev.ts':
        "import '../csp.config.mjs'; import '../csp/runtime/policy.mjs'; export function proxy() {}",
      'csp.config.mjs': 'export default {};',
      'csp/runtime/policy.mjs': 'export const noncePolicyFor = () => "synthetic";',
      'outside.mjs': 'export const value = true;',
    });
    expect(checkSourceBoundaries(root)).toEqual([]);
    writeFileSync(
      join(root, 'src/proxy.dev.ts'),
      "import '../outside.mjs'; export function proxy() {}",
    );
    expect(checkSourceBoundaries(root).some((message) => message.includes('outside src'))).toBe(
      true,
    );
    expectCliFailure(root, 'outside src');
  });

  it('does not lend the native Proxy exception to application or client imports', () => {
    const root = sourceFixture({
      'src/app/page.tsx': "import '../proxy.dev'; export default function Page(){ return null }",
      'src/proxy.dev.ts': "import '../csp.config.mjs'; export function proxy() {}",
      'csp.config.mjs': 'export default {};',
    });
    expect(
      checkSourceBoundaries(root).some((message) => message.includes('development-only Proxy')),
    ).toBe(true);
    writeFileSync(join(root, 'src/app/page.tsx'), 'export default function Page(){ return null }');
    writeFileSync(join(root, 'src/proxy.dev.ts'), "'use client'; export function proxy() {}");
    expect(checkSourceBoundaries(root).some((message) => message.includes('server-rendered'))).toBe(
      true,
    );
  });
});

describe('production and test source separation', () => {
  it('rejects unit/spec files and fixture folders in src through the actual CLI', () => {
    const root = sourceFixture({
      'src/app/page.tsx': 'export default function Page(){ return null }',
      'src/hooks/session.test.ts': 'export {};',
      'src/components/modal.spec.tsx': 'export {};',
      'src/__tests__/fixture.json': '{}',
    });
    expect(
      checkSourceBoundaries(root).filter((message) => message.includes('Test files must live')),
    ).toHaveLength(3);
    expectCliFailure(root, 'Test files must live under test/');
  });

  it('rejects runtime and type-only production imports from test, while separate tests are allowed', () => {
    const root = sourceFixture({
      'src/app/page.tsx': 'export default function Page(){ return null }',
      'src/model.ts': "import type { Model } from '../test/helper'; export type Value = Model;",
      'test/helper.ts': 'export type Model = string; export const value = 1;',
      'test/unit/model.test.ts':
        "import type { Value } from '../../src/model'; export type Fixture = Value;",
    });
    expect(
      checkSourceBoundaries(root).some((message) =>
        message.includes('Production source imports test code'),
      ),
    ).toBe(true);
    expectCliFailure(root, 'Production source imports test code');
    writeFileSync(join(root, 'src/model.ts'), "export { value } from '../test/helper';");
    expect(
      checkSourceBoundaries(root).some((message) =>
        message.includes('Production source imports test code'),
      ),
    ).toBe(true);
    writeFileSync(join(root, 'src/model.ts'), 'export type Value = string;');
    expect(checkSourceBoundaries(root)).toEqual([]);
  });
});
