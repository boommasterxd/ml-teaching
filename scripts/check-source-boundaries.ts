import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const code = /\.[cm]?[jt]sx?$/;
const route = /(?:^|[/\\])app[/\\](?:.*[/\\])?(?:page|layout)\.(?:dev\.ts|[jt]sx?)$/;
const appEntry =
  /(?:^|[/\\])app[/\\](?:.*[/\\])?(?:page|layout|route|template|default|not-found|robots|sitemap|manifest|opengraph-image|twitter-image|icon|apple-icon)\.(?:dev\.ts|[jt]sx?)$/;
const serverAppEntry =
  /(?:^|[/\\])app[/\\](?:.*[/\\])?(?:route|robots|sitemap|manifest|opengraph-image|twitter-image|icon|apple-icon)\.(?:dev\.ts|[jt]sx?)$/;
const nativePage = /^src\/pages\/(?:500|_app|_document)\.(?:dev\.ts|[jt]sx?)$/;
const testSource = /(?:^|\/)__tests__(?:\/|$)|\.(?:test|spec)\./;
const browserMl = /^@tensorflow(?:-models)?\//;
const serverPath = /(?:[/\\]server[/\\]|\.server\.[cm]?[jt]sx?$)/;
const syntaxProgram = ts.createProgram([], { noLib: true, noResolve: true });

function listFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(file) : [file];
  });
}

export function parseModule(file: string, text: string) {
  const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const directives = [];
  for (const statement of ast.statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) break;
    directives.push(statement.expression.text);
  }
  const imports: string[] = [];
  const allImports: string[] = [];
  const unresolvedImports: string[] = [];
  function recordImport(specifier: string, runtime: boolean) {
    allImports.push(specifier);
    if (runtime) imports.push(specifier);
  }
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      recordImport(node.moduleSpecifier.text, !typeOnlyImport(node.importClause));
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      recordImport(node.moduleSpecifier.text, runtimeExport(node));
    } else if (ts.isImportEqualsDeclaration(node)) {
      const reference = node.moduleReference;
      if (
        ts.isExternalModuleReference(reference) &&
        reference.expression &&
        ts.isStringLiteralLike(reference.expression)
      ) {
        recordImport(reference.expression.text, !node.isTypeOnly);
      }
    } else if (
      ts.isImportTypeNode(node) &&
      ts.isLiteralTypeNode(node.argument) &&
      ts.isStringLiteralLike(node.argument.literal)
    ) {
      recordImport(node.argument.literal.text, false);
    } else if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const argument = node.arguments[0];
      const isImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      if (isImport || isRequire) {
        if (ts.isStringLiteralLike(argument)) recordImport(argument.text, true);
        else unresolvedImports.push(node.getText(ast));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return {
    directives,
    imports,
    allImports,
    unresolvedImports,
    diagnostics: syntaxProgram.getSyntacticDiagnostics(ast),
  };
}

function runtimeExport(declaration: ts.ExportDeclaration) {
  if (declaration.isTypeOnly) return false;
  const bindings = declaration.exportClause;
  return (
    !bindings ||
    !ts.isNamedExports(bindings) ||
    bindings.elements.length === 0 ||
    bindings.elements.some((item) => !item.isTypeOnly)
  );
}

function typeOnlyImport(clause: ts.ImportClause | undefined): boolean {
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  const bindings = clause.namedBindings;
  return !!(
    !clause.name &&
    bindings &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((item) => item.isTypeOnly)
  );
}

function compilerOptions(root: string) {
  const configFile = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
  if (!configFile) return { moduleResolution: ts.ModuleResolutionKind.Bundler, allowJs: true };
  const config = ts.readConfigFile(configFile, ts.sys.readFile);
  if (config.error) throw new Error('Cannot parse tsconfig.json for boundary validation.');
  return ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configFile)).options;
}

interface BoundaryState {
  root: string;
  sourceRoot: string;
  options: ts.CompilerOptions;
  modules: Map<string, ReturnType<typeof parseModule>>;
  errors: string[];
  visited: Set<string>;
}

function rejectProxyConsumer(
  file: string,
  context: 'server' | 'client',
  state: BoundaryState,
  chain: string[],
) {
  if (file !== path.join(state.sourceRoot, 'proxy.dev.ts')) return false;
  if (context === 'server' && chain.length === 0) return false;
  state.errors.push(`Application imports development-only Proxy: ${[...chain, file].join(' -> ')}`);
  return true;
}

function canonicalProxyImport(file: string, target: string, state: BoundaryState) {
  if (file !== path.join(state.sourceRoot, 'proxy.dev.ts')) return false;
  return ['csp.config.mjs', 'csp/runtime/policy.mjs'].some(
    (allowed) => target === path.join(state.root, allowed),
  );
}

function traceImports(
  file: string,
  context: 'server' | 'client',
  state: BoundaryState,
  chain: string[] = [],
) {
  if (rejectProxyConsumer(file, context, state, chain)) return;
  const key = `${context}:${file}`;
  if (state.visited.has(key)) return;
  state.visited.add(key);
  const info = state.modules.get(file);
  if (!info) return;
  if (context === 'server' && info.directives.includes('use client')) return;
  if (context === 'client' && (info.imports.includes('server-only') || serverPath.test(file))) {
    state.errors.push(`Client imports server code: ${[...chain, file].join(' -> ')}`);
    return;
  }
  for (const expression of info.unresolvedImports) {
    state.errors.push(`Cannot verify computed ${context} import in ${file}: ${expression}`);
  }
  for (const specifier of info.imports) {
    if (context === 'server' && (browserMl.test(specifier) || specifier === 'client-only')) {
      state.errors.push(`Server imports browser code: ${[...chain, file, specifier].join(' -> ')}`);
    }
    const resolved = ts.resolveModuleName(specifier, file, state.options, ts.sys).resolvedModule;
    if (resolved && !resolved.isExternalLibraryImport) {
      const target = path.resolve(resolved.resolvedFileName);
      if (outsideDirectory(state.sourceRoot, target)) {
        if (!canonicalProxyImport(file, target, state)) {
          state.errors.push(`Application imports local module outside src: ${file} -> ${target}`);
        }
      } else {
        traceImports(target, context, state, [...chain, file]);
      }
    }
  }
}

function outsideDirectory(directory: string, file: string) {
  const relative = path.relative(directory, file);
  return relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
}

function checkTestImports(file: string, state: BoundaryState) {
  for (const specifier of state.modules.get(file)?.allImports ?? []) {
    const resolved = ts.resolveModuleName(specifier, file, state.options, ts.sys).resolvedModule;
    const target =
      resolved?.resolvedFileName ??
      (specifier.startsWith('.') ? path.resolve(path.dirname(file), specifier) : '');
    if (target && !outsideDirectory(path.join(state.root, 'test'), target)) {
      state.errors.push(`Production source imports test code: ${file} -> ${specifier}`);
    }
  }
}

export function checkSourceBoundaries(root = process.cwd()) {
  root = path.resolve(root);
  const sourceRoot = path.join(root, 'src');
  const sourceFiles = listFiles(sourceRoot);
  const files = sourceFiles.filter((file) => code.test(file));
  const modules = new Map(
    files.map((file) => [path.resolve(file), parseModule(file, readFileSync(file, 'utf8'))]),
  );
  const state: BoundaryState = {
    root,
    sourceRoot,
    modules,
    options: compilerOptions(root),
    errors: [],
    visited: new Set(),
  };
  const routes = files.filter((file) => appEntry.test(file));
  if (!files.some((file) => route.test(file)))
    state.errors.push('No App Router pages/layouts discovered.');
  for (const file of sourceFiles) {
    if (testSource.test(path.relative(sourceRoot, file).split(path.sep).join('/'))) {
      state.errors.push(`Test files must live under test/: ${file}`);
    }
  }
  for (const [file, info] of modules) {
    if (info.diagnostics.length) state.errors.push(`Cannot parse source: ${file}`);
    if (route.test(file) && info.directives.includes('use client')) {
      state.errors.push(`App Router page/layout must remain a Server Component: ${file}`);
    }
    if (serverAppEntry.test(file) && info.directives.includes('use client')) {
      state.errors.push(`Server-only route entry must remain server-rendered: ${file}`);
    }
    if (
      nativePage.test(path.relative(root, file).split(path.sep).join('/')) ||
      file === path.join(sourceRoot, 'proxy.dev.ts')
    ) {
      routes.push(file);
      if (info.directives.includes('use client'))
        state.errors.push(`Native entry must remain server-rendered: ${file}`);
    }
    checkTestImports(file, state);
    if (info.directives.includes('use client')) traceImports(file, 'client', state);
  }
  for (const file of routes) traceImports(path.resolve(file), 'server', state);
  return state.errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = checkSourceBoundaries();
  for (const error of errors) console.error(error);
  if (errors.length) process.exitCode = 1;
}
