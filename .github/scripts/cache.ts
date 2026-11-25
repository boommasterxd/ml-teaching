import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const family = 'mlteaching-npm-v1-';
const npmInstallInputs = ['.npmrc', 'package.json', 'package-lock.json'];

export function npmInputDigest(readInput: (file: string) => Buffer = readFileSync) {
  const hash = createHash('sha256');
  for (const file of npmInstallInputs) {
    const bytes = readInput(file);
    hash.update(`${file}\0${bytes.length}\0`).update(bytes);
  }
  return hash.digest('hex');
}

export function cacheConfiguration(hash: string, npmVersion: string, cacheRoot: string) {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Missing complete cache input hash.');
  const npmMajor = /^(\d+)\.\d+\.\d+$/.exec(npmVersion)?.[1];
  if (!npmMajor || !path.isAbsolute(cacheRoot) || /[\r\n\0]/.test(cacheRoot)) {
    throw new Error('Invalid npm cache configuration.');
  }
  if (
    process.platform !== 'linux' ||
    process.arch !== 'x64' ||
    process.versions.node.split('.')[0] !== '26'
  ) {
    throw new Error('Dependency caching requires the approved Linux x64 Node.js 26 runtime.');
  }
  const prefix = `${family}Linux-x64-node26-npm${npmMajor}-`;
  return { prefix, key: `${prefix}${hash}`, path: path.join(cacheRoot, '_cacache') };
}

export function replacementReceipt(key: string, prefix: string) {
  if (!/^mlteaching-npm-v1-Linux-x64-node26-npm\d+-$/.test(prefix)) {
    throw new Error('Invalid compatible cache prefix.');
  }
  if (!key.startsWith(prefix) || !/^[a-f0-9]{64}$/.test(key.slice(prefix.length))) {
    throw new Error('Missing native producer cache identity.');
  }
  return [{ family: 'npm', key, prefix }];
}

export function restoreOutcome(primary: string, matched: string, outcome: string) {
  if (outcome === 'failure') return 'error';
  // The cache action can report success after an internal restore error.
  if (outcome !== 'success' || !matched) return 'unknown';
  const prefix = /^(mlteaching-npm-v1-Linux-x64-node26-npm\d+-)[a-f0-9]{64}$/.exec(primary)?.[1];
  if (!prefix) return 'unknown';
  if (matched === primary) return 'exact';
  return matched.startsWith(prefix) && /^[a-f0-9]{64}$/.test(matched.slice(prefix.length))
    ? 'compatible fallback'
    : 'unknown';
}

function main() {
  const output = process.env.GITHUB_OUTPUT;
  if (process.env.GITHUB_ACTIONS !== 'true' || !output) {
    throw new Error('Cache metadata requires an explicit GitHub Actions context.');
  }
  if (process.argv[2] === 'configure') {
    const npm = (args: string[]) =>
      execFileSync('npm', args, { encoding: 'utf8', timeout: 10_000 }).trim();
    const config = cacheConfiguration(
      npmInputDigest(),
      npm(['--version']),
      npm(['config', 'get', 'cache']),
    );
    for (const [name, value] of Object.entries(config))
      appendFileSync(output, `${name}=${value}\n`);
  } else if (process.argv[2] === 'receipt') {
    const receipt = JSON.stringify(
      replacementReceipt(process.env.CACHE_PRIMARY_KEY ?? '', process.env.CACHE_PREFIX ?? ''),
    );
    const directory = process.env.RUNNER_TEMP;
    if (!directory || !path.isAbsolute(directory))
      throw new Error('Missing runner temporary directory.');
    const file = path.join(directory, 'replacements.json');
    writeFileSync(file, `${receipt}\n`, { mode: 0o600 });
    appendFileSync(output, `replacements=${receipt}\npath=${file}\n`);
  } else if (process.argv[2] === 'summary') {
    const summary = process.env.GITHUB_STEP_SUMMARY;
    if (!summary) throw new Error('Missing runner summary file.');
    const outcome = restoreOutcome(
      process.env.CACHE_PRIMARY_KEY ?? '',
      process.env.CACHE_MATCHED_KEY ?? '',
      process.env.CACHE_RESTORE_OUTCOME ?? '',
    );
    appendFileSync(
      summary,
      `npm cache restore: **${outcome}**. The locked installation remains required.\n`,
    );
  } else throw new Error('Use configure, receipt or summary.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
