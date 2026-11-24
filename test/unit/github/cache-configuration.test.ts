import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempDisposableSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  cacheConfiguration,
  npmInputDigest,
  replacementReceipt,
  restoreOutcome,
} from '../../../.github/scripts/cache.ts';

const hash = 'a'.repeat(64);
const prefix = 'mlteaching-npm-v1-Linux-x64-node26-npm11-';
const key = `${prefix}${hash}`;

describe('npm cache adapter', () => {
  it('reuses the digest after worker tuning and rotates it for actual npm install inputs', () => {
    using directory = mkdtempDisposableSync(path.join(tmpdir(), 'npm-cache-inputs-'));
    mkdirSync(path.join(directory.path, '.github/workflows'), { recursive: true });
    const inputs = {
      '.npmrc': 'engine-strict=true\n',
      'package.json': '{"name":"test-fixture"}\n',
      'package-lock.json': '{"lockfileVersion":3}\n',
    };
    const write = (file: string, value: string) =>
      writeFileSync(path.join(directory.path, file), value);
    const digest = () => npmInputDigest((file) => readFileSync(path.join(directory.path, file)));
    for (const [file, content] of Object.entries(inputs)) write(file, content);
    const ci = '.github/workflows/ci.yml';
    write(ci, 'run: npm run test:e2e -- --workers=2\n');
    const original = digest();
    write(ci, 'run: npm run test:e2e -- --workers=3\n');
    expect(digest()).toBe(original);
    for (const [file, content] of Object.entries(inputs)) {
      write(file, `${content}\n`);
      expect(digest()).not.toBe(original);
      write(file, content);
    }
    expect(restoreOutcome(`${prefix}${original}`, key, 'success')).toBe('compatible fallback');
  });

  it('isolates the compatible content store and preserves the complete input identity', () => {
    expect(cacheConfiguration(hash, '11.20.0', '/tmp/npm')).toEqual({
      key,
      prefix,
      path: '/tmp/npm/_cacache',
    });
    expect(cacheConfiguration('b'.repeat(64), '11.21.0', '/tmp/npm').prefix).toBe(prefix);
    expect(cacheConfiguration(hash, '12.0.0', '/tmp/npm').prefix).not.toBe(prefix);
    expect(() => cacheConfiguration('missing', '11.20.0', '/tmp/npm')).toThrow();
    expect(() => cacheConfiguration(hash, '11.20.0', '/tmp/npm\nkey=other')).toThrow();
    expect(() => cacheConfiguration(hash, '11.20.0', 'relative-cache')).toThrow();
  });

  it('accepts only a native complete key in its declared compatible family', () => {
    expect(replacementReceipt(key, prefix)).toEqual([{ family: 'npm', key, prefix }]);
    expect(() => replacementReceipt('', prefix)).toThrow();
    expect(() => replacementReceipt(`${prefix}partial`, prefix)).toThrow();
    expect(() => replacementReceipt(key, 'node-cache-')).toThrow();
  });

  it('keeps misses, failed and unknown restorations distinct from confirmed reuse', () => {
    expect(restoreOutcome(key, key, 'success')).toBe('exact');
    expect(restoreOutcome(key, `${prefix}${'b'.repeat(64)}`, 'success')).toBe(
      'compatible fallback',
    );
    expect(restoreOutcome(key, '', 'success')).toBe('cold');
    expect(restoreOutcome(key, '', 'failure')).toBe('error');
    expect(restoreOutcome('', '', 'skipped')).toBe('unknown');
    expect(restoreOutcome(key, `other-${hash}`, 'success')).toBe('unknown');
  });

  it('writes only the bounded replacement receipt and native restore evidence', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'npm-cache-adapter-'));
    const output = path.join(directory, 'outputs');
    const summary = path.join(directory, 'summary');
    const env = {
      ...process.env,
      GITHUB_ACTIONS: 'true',
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary,
      RUNNER_TEMP: directory,
      CACHE_PRIMARY_KEY: key,
      CACHE_MATCHED_KEY: key,
      CACHE_RESTORE_OUTCOME: 'success',
      CACHE_PREFIX: prefix,
    };
    try {
      for (const mode of ['receipt', 'summary']) {
        execFileSync(process.execPath, ['.github/scripts/cache.ts', mode], {
          env,
          timeout: 10_000,
          stdio: 'pipe',
        });
      }
      expect(JSON.parse(readFileSync(path.join(directory, 'replacements.json'), 'utf8'))).toEqual([
        { family: 'npm', key, prefix },
      ]);
      expect(readFileSync(output, 'utf8')).toContain(`path=${directory}/replacements.json`);
      expect(readFileSync(summary, 'utf8')).toContain('**exact**');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
