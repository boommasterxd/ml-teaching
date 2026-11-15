import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ESLint } from 'eslint';
import { checkQualityLimits } from '../../scripts/check-quality-limits.ts';

const fixtures: string[] = [];

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('blocking quality gates', () => {
  it('rejects oversized root configuration through the native CLI', () => {
    const root = mkdtempSync(join(tmpdir(), 'ml-teaching-quality-'));
    fixtures.push(root);
    const file = join(root, 'next.config.mjs');
    writeFileSync(file, Array(500).fill('// configuration fixture').join('\n'));
    expect(checkQualityLimits(root)).toEqual([]);
    writeFileSync(file, Array(501).fill('// configuration fixture').join('\n'));
    expect(checkQualityLimits(root)).toEqual([`${file}: 501 lines exceeds the 500-line limit.`]);
    const result = spawnSync(process.execPath, [resolve('scripts/check-quality-limits.ts')], {
      cwd: root,
      encoding: 'utf8',
      timeout: 10_000,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('exceeds the 500-line limit');
  });

  it('enforces root configuration complexity and propagates lint failure', async () => {
    const source = `export function configuration(value) {
      ${Array.from({ length: 21 }, (_, index) => `if (value === ${index}) return ${index};`).join('\n')}
      return null;
    }`;
    const [result] = await new ESLint().lintText(source, { filePath: 'next.config.mjs' });
    expect(result.messages.some((message) => message.ruleId === 'complexity')).toBe(true);
    const cli = spawnSync(
      process.execPath,
      [
        resolve('node_modules/eslint/bin/eslint.js'),
        '--stdin',
        '--stdin-filename',
        'next.config.mjs',
        '--max-warnings',
        '0',
      ],
      { input: source, encoding: 'utf8', timeout: 10_000 },
    );
    expect(cli.status).toBe(1);
    expect(cli.stdout).toContain('complexity');
  });

  it('exempts only imported Vitest suite containers, keeping test and helper limits', async () => {
    const lint = new ESLint();
    const options = { filePath: 'test/unit/function-limit-fixture.test.ts' };
    const body = Array(105).fill('consume(value);').join('\n');
    const cases = Array.from({ length: 105 }, (_, index) => `it('case ${index}', () => {});`).join(
      '\n',
    );
    const sources = [
      [`import { describe, it } from 'vitest'; describe('suite', () => { ${cases} });`, 0],
      [
        `import { describe, it } from 'vitest'; describe('suite', () => { it('actual test', () => { ${body} }); });`,
        1,
      ],
      [
        `const describe = (name, callback) => callback(); describe('local function', () => { ${body} });`,
        1,
      ],
      [
        `import { describe } from 'vitest'; describe('suite', () => { function helper(value) { ${body} } });`,
        1,
      ],
    ] as const;
    for (const [source, errors] of sources) {
      const [result] = await lint.lintText(source, options);
      expect(
        result.messages.filter((message) => message.ruleId === 'quality/test-function-length'),
      ).toHaveLength(errors);
    }
  });
});
