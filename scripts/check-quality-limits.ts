import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function checkQualityLimits(root = process.cwd()) {
  const errors: string[] = [];
  function checkFile(file: string) {
    if (!/\.(?:[cm]?[jt]sx?|css)$/.test(file)) return;
    const lines = readFileSync(file, 'utf8').trimEnd().split('\n').length;
    if (lines > 500) errors.push(`${file}: ${lines} lines exceeds the 500-line limit.`);
  }
  function visit(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else checkFile(file);
    }
  }
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isFile()) checkFile(path.join(root, entry.name));
  }
  for (const directory of ['src', 'scripts', 'csp', '.github/scripts', 'test']) {
    try {
      visit(path.join(root, directory));
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    }
  }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkQualityLimits();
  for (const error of errors) console.error(error);
  if (errors.length) process.exitCode = 1;
}
