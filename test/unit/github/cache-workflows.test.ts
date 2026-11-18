import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import policy from '../../../.github/cache-policy.json';
import { selectWork } from '../../../.github/scripts/plan-ci.ts';

const read = (file: string) => readFileSync(`.github/${file}`, 'utf8');
const ci = read('workflows/ci.yml');
const producer = read('workflows/dependency-cache.yml');
const cleanup = read('workflows/cache-lifecycle.yml');
const steps = (yaml: string) => yaml.split(/(?=^      - )/m).slice(1);

describe('dependency-cache workflow contracts', () => {
  it('shares complete dependency identities and covers every producer input trigger', () => {
    const hashes = [...`${ci}\n${producer}`.matchAll(/CACHE_INPUT_HASH: (.+)/g)];
    expect(hashes).toHaveLength(3);
    expect(new Set(hashes.map((match) => match[1])).size).toBe(1);
    const paths = producer.split('  workflow_dispatch:')[0];
    for (const input of policy.producerInputs) {
      expect(paths).toContain(`      - ${input}${input.endsWith('/') ? '**' : ''}\n`);
    }
    expect(policy.retiredPrefixes).toEqual([]);
    expect(selectWork(['.github/workflows/dependency-cache.yml']).reason).toBe('full');
    expect(selectWork(['.github/scripts/cache-lifecycle/core.cjs']).reason).toBe('full');
  });

  it('keeps all PR cache preparation optional while retaining locked installs and gates', () => {
    const optional = steps(ci).filter((step) => step.includes('continue-on-error: true'));
    expect(optional).toHaveLength(6);
    expect(
      optional.every((step) =>
        /cache.ts (?:configure|summary)|actions\/cache\/restore@/.test(step),
      ),
    ).toBe(true);
    const restores = steps(ci).filter((step) => step.includes('actions/cache/restore@'));
    expect(restores).toHaveLength(2);
    expect(
      restores.every((step) => step.includes("if: steps.cache-config.outcome == 'success'")),
    ).toBe(true);
    expect(ci).not.toMatch(/\bcache: npm|actions\/cache(?:\/save)?@/);
    expect(ci.match(/run: npm ci --no-audit/g)).toHaveLength(2);
    expect(ci).toContain('needs: [plan, quality, browser]');
    expect(ci).toContain('if: always()');
  });

  it('writes replacement receipts only from the actual trusted producer identity', () => {
    expect(producer).toContain(`github.repository == '${policy.repository}'`);
    expect(producer).toContain("github.ref == 'refs/heads/main'");
    expect(producer).toContain("github.event.repository.default_branch == 'main'");
    expect(producer).toContain('key: ${{ steps.cache.outputs.cache-primary-key }}');
    expect(producer).toContain('CACHE_PRIMARY_KEY: ${{ steps.cache.outputs.cache-primary-key }}');
    expect(producer).toContain('name: cache-lifecycle-receipts-${{ github.run_attempt }}');
    expect(producer).toContain('retention-days: 7');
    expect(producer).not.toMatch(/npm run (?:ci|build|test)/);
    expect(producer).toContain('needs: warm');
    expect(policy.producerWorkflows[0]).toEqual({
      name: 'Dependency cache',
      path: '.github/workflows/dependency-cache.yml',
      job: 'Warm npm cache',
    });
  });

  it('keeps privileged completion cleanup on trusted main without executing PR code', () => {
    expect(cleanup).toContain('types: [closed]');
    expect(cleanup).toContain('types: [completed]');
    expect(cleanup).toContain('ref: main');
    expect(cleanup).toContain('actions: write');
    expect(cleanup).not.toMatch(
      /npm ci|npm install|pull_request\.head|checkout.*head|download-artifact/,
    );
    expect(cleanup).not.toContain('      - Cache lifecycle');
    for (const file of [
      'ci',
      'commit-style-check',
      'dependabot-auto-merge',
      'gitleaks',
      'update-gitleaks',
      'dependency-cache',
    ]) {
      const name = /^name: (.+)$/m.exec(read(`workflows/${file}.yml`))?.[1];
      expect(cleanup).toContain(`      - ${name}\n`);
    }
  });
});
