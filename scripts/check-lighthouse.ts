import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import lighthouse from 'lighthouse';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ args: ['--remote-debugging-port=9223'] });
try {
  await mkdir('test-results/lighthouse', { recursive: true });
  for (const formFactor of ['mobile', 'desktop']) {
    const report = await lighthouse('http://127.0.0.1:3100', {
      port: 9223,
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      ...(formFactor === 'desktop'
        ? {
            formFactor: 'desktop',
            screenEmulation: {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            },
            throttlingMethod: 'provided',
          }
        : {}),
    });
    if (!report || report.lhr.runtimeError) throw new Error('Lighthouse did not complete.');
    await writeFile(`test-results/lighthouse/${formFactor}.json`, report.report);
    const scores = Object.fromEntries(
      Object.entries(report.lhr.categories).map(([key, category]) => [key, category.score]),
    );
    console.log(formFactor, scores);
    if (Object.values(scores).some((score) => score === null)) process.exitCode = 1;
  }
} finally {
  await browser.close();
}
