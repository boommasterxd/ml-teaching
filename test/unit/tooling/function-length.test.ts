import { ESLint } from 'eslint';
import { expect, it } from 'vitest';

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
