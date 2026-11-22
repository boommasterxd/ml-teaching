import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ESLint } from 'eslint';
import { checkQualityLimits } from '../../scripts/check-quality-limits.ts';

const fixtures: string[] = [];

afterEach(() => {
  for (const root of fixtures.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('blocking quality gates', () => {
  it.each(['next.config.mjs', 'src/site.css'])('rejects an oversized %s via the CLI', (path) => {
    const root = mkdtempSync(join(tmpdir(), 'ml-teaching-quality-'));
    fixtures.push(root);
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Array(500).fill('/* source fixture */').join('\n'));
    expect(checkQualityLimits(root)).toEqual([]);
    writeFileSync(file, Array(501).fill('/* source fixture */').join('\n'));
    expect(checkQualityLimits(root)).toEqual([`${file}: 501 lines exceeds the 500-line limit.`]);
    const result = spawnSync(process.execPath, [resolve('scripts/check-quality-limits.ts')], {
      cwd: root,
      encoding: 'utf8',
      timeout: 10_000,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('exceeds the 500-line limit');
  });

  it('enforces root configuration complexity and propagates lint failure', () => {
    const source = `export function configuration(value) {
      ${Array.from({ length: 21 }, (_, index) => `if (value === ${index}) return ${index};`).join('\n')}
      return null;
    }`;
    const cli = spawnSync(
      process.execPath,
      [
        resolve('node_modules/eslint/bin/eslint.js'),
        '--stdin',
        '--stdin-filename',
        'next.config.mjs',
        '--format',
        'json',
        '--max-warnings',
        '0',
      ],
      { input: source, encoding: 'utf8', timeout: 10_000 },
    );
    expect(cli.status, cli.stderr).toBe(1);
    expect(JSON.parse(cli.stdout)).toEqual([
      expect.objectContaining({
        messages: expect.arrayContaining([expect.objectContaining({ ruleId: 'complexity' })]),
      }),
    ]);
  });

  it('blocks oversized and complex CSP runtime through the existing gates', async () => {
    const root = mkdtempSync(join(tmpdir(), 'ml-teaching-csp-quality-'));
    fixtures.push(root);
    mkdirSync(join(root, 'csp/runtime'), { recursive: true });
    const file = join(root, 'csp/runtime/policy.mjs');
    writeFileSync(file, Array(501).fill('// CSP runtime fixture').join('\n'));
    expect(checkQualityLimits(root)).toEqual([`${file}: 501 lines exceeds the 500-line limit.`]);
    const source = `export function policy(value) {
      ${Array.from({ length: 21 }, (_, index) => `if (value === ${index}) return ${index};`).join('\n')}
      return null;
    }`;
    const [result] = await new ESLint().lintText(source, { filePath: 'csp/runtime/policy.mjs' });
    expect(result.messages.some((message) => message.ruleId === 'complexity')).toBe(true);
    const oversized = `export function policy(value) {\n${'consume(value);\n'.repeat(105)}}`;
    const [longFunction] = await new ESLint().lintText(oversized, {
      filePath: 'csp/runtime/policy.mjs',
    });
    expect(
      longFunction.messages.some((message) => message.ruleId === 'max-lines-per-function'),
    ).toBe(true);
    const cli = spawnSync(process.execPath, [resolve('scripts/check-quality-limits.ts')], {
      cwd: root,
      encoding: 'utf8',
      timeout: 10_000,
    });
    expect(cli.status).toBe(1);
  });

  it('blocks copied CSP runtime through the actual duplication configuration', () => {
    const root = mkdtempSync(join(tmpdir(), 'ml-teaching-csp-duplication-'));
    fixtures.push(root);
    mkdirSync(join(root, 'csp/runtime'), { recursive: true });
    const source = Array.from({ length: 20 }, (_, index) => `const value${index} = ${index};`).join(
      '\n',
    );
    writeFileSync(join(root, 'csp/runtime/first.mjs'), source);
    writeFileSync(join(root, 'csp/runtime/second.mjs'), source);
    const config = join(root, '.jscpd.json');
    writeFileSync(config, readFileSync('.jscpd.json', 'utf8'));
    for (const path of JSON.parse(readFileSync(config, 'utf8')).path as string[]) {
      if (/\.(mjs|ts)$/.test(path)) writeFileSync(join(root, path), 'export {};');
      else mkdirSync(join(root, path), { recursive: true });
    }
    const cli = spawnSync(
      process.execPath,
      [resolve('node_modules/jscpd/run-jscpd.js'), '--config', config],
      { cwd: root, encoding: 'utf8', timeout: 10_000 },
    );
    expect(cli.status, cli.stdout + cli.stderr).toBe(1);
    expect(cli.stdout + cli.stderr).toContain('second.mjs');
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
