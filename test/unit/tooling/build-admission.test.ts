import { expect, it } from 'vitest';
import { ignoreBuild } from '../../../scripts/ignore-build.ts';

const previous = 'a'.repeat(40);
const current = 'b'.repeat(40);

function history(diff: string, newManifest = '{"scripts":{}}') {
  return (args: string[]) => {
    switch (args[0]) {
      case 'rev-parse':
        return `${current}\n`;
      case 'merge-base':
        return '';
      case 'show':
        return args[1].startsWith(previous) ? '{"scripts":{}}' : newManifest;
      case 'diff':
        expect(args.slice(-2)).toEqual([previous, current]);
        return diff;
      default:
        throw new Error(`Unexpected Git command: ${args[0]}`);
    }
  };
}

it('skips a complete docs-only deployment diff and builds if the previous deployment lacks runtime changes', () => {
  const docs = 'docs/deployment.md\0';
  expect(ignoreBuild(previous, current, history(docs))).toBe(0);
  expect(ignoreBuild(previous, current, history('src/app/page.tsx\0' + docs))).toBe(1);
  expect(ignoreBuild(previous, current, history('docs/deployment.md'))).toBe(1);
});

it('builds when a package edit changes runtime inputs or when its manifest cannot be verified', () => {
  const packageDiff = 'package.json\0';
  expect(
    ignoreBuild(previous, current, history(packageDiff, '{"scripts":{"lint":"eslint ."}}')),
  ).toBe(0);
  expect(
    ignoreBuild(
      previous,
      current,
      history(packageDiff, '{"scripts":{"prebuild":"node changed.mjs"}}'),
    ),
  ).toBe(1);
  expect(ignoreBuild(previous, current, history(packageDiff, '{'))).toBe(1);
});
