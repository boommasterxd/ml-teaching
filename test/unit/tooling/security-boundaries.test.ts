import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempDisposableSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { checkSourceBoundaries } from '../../../scripts/check-source-boundaries.ts';

function writeSources(root: string, files: Record<string, string>) {
  for (const [name, source] of Object.entries(files)) {
    const path = join(root, name);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, source);
  }
}

it('allows browser ML behind an explicit client boundary but rejects a server route importing the same transitive module', () => {
  using fixture = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-boundaries-'));
  writeSources(fixture.path, {
    'tsconfig.json':
      '{"compilerOptions":{"paths":{"@/*":["./src/*"]},"moduleResolution":"bundler"}}',
    'src/app/lernen/page.tsx':
      "import type { Tensor } from '@tensorflow/tfjs-core'; import Client from '@/ui'; export default function Page(){ return <Client/> }",
    'src/ui.tsx':
      "'use client'; import { train } from '@/barrel'; export default function Client(){ return <button onClick={train}>Train</button> }",
    'src/barrel.ts': "export { train } from './train';",
    'src/train.ts': "export const train = () => import('@tensorflow/tfjs-core');",
  });
  expect(checkSourceBoundaries(fixture.path)).toEqual([]);

  writeSources(fixture.path, {
    'src/app/lernen/page.tsx':
      "import { train } from '@/barrel'; export default function Page(){ return <button onClick={train}>Train</button> }",
  });
  const result = spawnSync(process.execPath, [resolve('scripts/check-source-boundaries.ts')], {
    cwd: fixture.path,
    encoding: 'utf8',
    timeout: 10_000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('Server imports browser code');
});

it('rejects browser code reaching a server-only module and production code importing test fixtures', () => {
  using fixture = mkdtempDisposableSync(join(tmpdir(), 'ml-teaching-boundaries-'));
  writeSources(fixture.path, {
    'tsconfig.json': '{}',
    'src/app/page.tsx':
      "import Client from '../ui'; export default function Page(){ return <Client/> }",
    'src/ui.tsx': "'use client'; import './data'; export default function Client(){ return null }",
    'src/data.ts':
      "import 'server-only'; import type { Sample } from '../test/sample'; export type Data = Sample;",
    'test/sample.ts': 'export type Sample = string;',
  });
  expect(checkSourceBoundaries(fixture.path)).toEqual(
    expect.arrayContaining([
      expect.stringContaining('Client imports server code'),
      expect.stringContaining('Production source imports test code'),
    ]),
  );
});
