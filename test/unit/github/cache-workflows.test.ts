import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import policy from '../../../.github/cache-policy.json';
import { selectWork } from '../../../.github/scripts/plan-ci.ts';

const read = (file: string) => readFileSync(`.github/${file}`, 'utf8');
const ci = read('workflows/ci.yml');
const producer = read('workflows/dependency-cache.yml');
const reconciliation = read('workflows/dependency-cache-reconciliation.yml');
const cleanup = read('workflows/cache-lifecycle.yml');
const steps = (yaml: string) => yaml.split(/(?=^      - )/m).slice(1);
const revision = 'a'.repeat(40);
const cacheKey = `mlteaching-npm-v1-Linux-x64-node26-npm11-${'b'.repeat(64)}`;

function confirmScheduleMiss(mainSha: string, cacheInventory: string) {
  const confirm = steps(reconciliation).find((step) => step.includes('id: confirm'));
  const command = confirm?.split('run: |\n')[1]?.split('\n\n')[0];
  if (!command) throw new Error('Missing cache confirmation command');
  const directory = mkdtempSync(path.join(tmpdir(), 'npm-cache-reconciliation-'));
  const output = path.join(directory, 'outputs');
  try {
    writeFileSync(output, '');
    const { status, stderr } = spawnSync(
      'bash',
      [
        '-c',
        `
        gh() {
          case "$*" in
            "api repos/$GITHUB_REPOSITORY/git/ref/heads/main --jq .object.sha")
              printf '%s\\n' "$MAIN_SHA" ;;
            "api -X GET repos/$GITHUB_REPOSITORY/actions/caches -f ref=refs/heads/main -f key=$CACHE_KEY")
              printf '%s\\n' "$CACHE_INVENTORY" ;;
            *) return 1 ;;
          esac
        }
        timeout() { shift; "$@"; }
        ${command}
      `,
      ],
      {
        encoding: 'utf8',
        timeout: 5000,
        env: {
          NODE_ENV: 'test',
          PATH: process.env.PATH,
          GITHUB_REPOSITORY: policy.repository,
          GITHUB_SHA: revision,
          GITHUB_OUTPUT: output,
          CACHE_KEY: cacheKey,
          MAIN_SHA: mainSha,
          CACHE_INVENTORY: cacheInventory,
        },
      },
    );
    return { status, stderr, output: readFileSync(output, 'utf8') };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

it('replaces overlapping code runs per PR and isolates metadata edits and retries', () => {
  const concurrency = (workflow: string) =>
    /^concurrency:\n((?: +[^\n]+\n)+)/m.exec(workflow)?.[1].trim().replace(/\s+/g, ' ');
  const ciConcurrency = concurrency(ci);
  const gitleaksConcurrency = concurrency(read('workflows/gitleaks.yml'));
  const prGroup =
    "github.run_attempt > 1 && format('retry-{0}', github.run_id) " +
    "|| (github.event.action == 'edited' && !github.event.changes.base) " +
    "&& format('metadata-{0}-{1}', github.event.pull_request.number, github.sha) " +
    "|| format('pr-{0}', github.event.pull_request.number)";
  const cancelNewCode =
    "github.run_attempt == 1 && (github.event.action != 'edited' || github.event.changes.base != null)";
  expect(ciConcurrency).toBe(
    `group: >- ci-\${{ ${prGroup} }} cancel-in-progress: \${{ ${cancelNewCode} }}`,
  );
  expect(gitleaksConcurrency).toBe(
    "group: >- gitleaks-${{ github.event_name == 'workflow_dispatch' && format('manual-{0}', github.ref) " +
      `|| ${prGroup} }} cancel-in-progress: >- \${{ github.event_name == 'workflow_dispatch' || (${cancelNewCode}) }}`,
  );
});

it('allocates both full browser slots and passes their aggregate result to CI', () => {
  const browser = ci.split('\n  browser:\n')[1]?.split('\n  CI:\n')[0] ?? '';
  const slots = /fromJSON\('([^']+)'\)\[fromJSON\(needs\.plan\.outputs\.plan\)\.reason\]/.exec(
    browser,
  )?.[1];
  const launcher = steps(browser).find((step) =>
    step.includes('run: node .github/scripts/browser-ci.ts'),
  );

  expect(browser).toContain("if: needs.plan.outputs.browser == 'true'");
  expect(browser).toContain('fail-fast: false');
  expect(JSON.parse(slots ?? 'null')).toEqual({ full: [0, 1], 'browser-spec': [0] });
  expect(launcher).toContain('CI_BROWSER_SLOT: ${{ strategy.job-index }}');
  expect(launcher).toContain('CI_BROWSER_SLOTS: ${{ strategy.job-total }}');
  expect(ci).toContain('"browser":"${{ needs.browser.result }}"');
});

describe('dependency-cache workflow contracts', () => {
  it('shares complete dependency identities and covers every producer input trigger', () => {
    const callers = [ci, producer, reconciliation].join('\n');
    expect(callers.match(/run: node \.github\/scripts\/cache\.ts configure\n/g)).toHaveLength(4);
    expect(callers).not.toContain('CACHE_INPUT_HASH');
    const paths = producer.split('  workflow_dispatch:')[0];
    for (const input of policy.producerInputs) {
      expect(paths).toContain(`      - ${input}${input.endsWith('/') ? '**' : ''}\n`);
    }
    for (const input of ['package.json', 'package-lock.json', '.npmrc']) {
      expect(policy.producerInputs).toContain(input);
    }
    expect(paths).not.toContain('.github/workflows/ci.yml');
    expect(policy.producerInputs).not.toContain('.github/workflows/ci.yml');
    expect(policy.retiredPrefixes).toEqual([]);
    expect(selectWork(['.github/workflows/dependency-cache.yml']).reason).toBe('full');
    expect(selectWork(['.github/workflows/dependency-cache-reconciliation.yml']).reason).toBe(
      'full',
    );
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
    expect(producer).toContain('ref: ${{ github.sha }}');
    expect(producer).toContain('key: ${{ steps.cache.outputs.cache-primary-key }}');
    expect(producer).toContain('CACHE_PRIMARY_KEY: ${{ steps.cache.outputs.cache-primary-key }}');
    expect(producer).toContain('name: cache-lifecycle-receipts-${{ github.run_attempt }}');
    expect(producer).toContain('retention-days: 7');
    expect(producer).not.toMatch(/npm run (?:ci|build|test)/);
    const install = steps(producer).find((step) => step.includes('run: npm ci --no-audit'));
    expect(install).toContain("if: steps.cache.outputs.cache-hit != 'true'");
    expect(producer).toContain('needs: warm');
    expect(policy.producerWorkflows[0]).toEqual({
      name: 'Dependency cache',
      path: '.github/workflows/dependency-cache.yml',
      job: 'Warm npm cache',
    });
  });

  it('isolates scheduled cache lookups from the existing main-only producer', () => {
    expect(reconciliation).toContain('  schedule:');
    expect(reconciliation).toContain('group: dependency-cache-reconciliation-main');
    expect(reconciliation).toContain(`github.repository == '${policy.repository}'`);
    expect(reconciliation).toContain("github.ref == 'refs/heads/main'");
    expect(reconciliation).toContain("github.event.repository.default_branch == 'main'");
    expect(reconciliation).toContain('ref: ${{ github.sha }}');
    expect(reconciliation).toContain('lookup-only: true');
    expect(reconciliation).not.toMatch(/restore-keys:|npm ci|actions\/cache\/save@/);
    const [probe, request] = reconciliation.split('  request-warmup:\n');
    expect(probe).not.toContain('actions: write');
    expect(request).toContain("if: needs.probe.outputs.missing == 'true'");
    expect(request).toContain('actions: write');
    expect(request).toContain('actions/workflows/dependency-cache.yml/dispatches" -f ref=main');
    expect(request).not.toContain('uses:');
  });

  it('requests warming only when the live main revision has no cache entry', () => {
    const miss = '{"total_count":0,"actions_caches":[]}';
    const ready = confirmScheduleMiss(revision, miss);
    expect(ready.status, ready.stderr).toBe(0);
    expect(ready.output).toBe('missing=true\n');

    const advanced = confirmScheduleMiss('c'.repeat(40), miss);
    expect(advanced.status).toBe(0);
    expect(advanced.output).toBe('');

    const raced = confirmScheduleMiss(
      revision,
      JSON.stringify({
        total_count: 1,
        actions_caches: [{ ref: 'refs/heads/main', key: cacheKey, size_in_bytes: 1024 }],
      }),
    );
    expect(raced.status).toBe(0);
    expect(raced.output).toBe('');

    const unverified = confirmScheduleMiss(revision, '{"total_count":0}');
    expect(unverified.status).not.toBe(0);
    expect(unverified.output).toBe('');
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
      'dependency-cache-reconciliation',
    ]) {
      const name = /^name: (.+)$/m.exec(read(`workflows/${file}.yml`))?.[1];
      expect(cleanup).toContain(`      - ${name}\n`);
    }
  });
});
