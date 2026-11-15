export interface FileOutput {
  pathname: string;
  filePath: string;
}
export interface AssetLookup {
  get(pathname: string): AssetHashes | undefined | Promise<AssetHashes | undefined>;
}
export interface AssetHashes {
  sha256: string;
  sha384: string;
  sha512: string;
}
export interface PrerenderOutput {
  pathname: string;
  groupId: number;
  routeType?: string;
  response?: string;
  compute?: string;
  config: { partialFallback?: boolean; renderingMode?: string };
  fallback?: {
    filePath?: string;
    initialRevalidate?: number | false;
    postponedState?: string;
    initialHeaders?: Record<string, string | string[]>;
  };
}
export interface HeaderRoute {
  source?: string;
  sourceRegex: string;
  headers?: Record<string, string>;
  missing?: Array<{ type: string; key: string }>;
}
export interface BuildContext {
  projectDir: string;
  distDir: string;
  nextVersion: string;
  buildId: string;
  config: AppConfig;
  routing: { beforeMiddleware: HeaderRoute[]; middlewareMatchers: HeaderRoute[] };
  outputs: {
    staticFiles: FileOutput[];
    appPages?: Array<{ pathname: string }>;
    prerenders: PrerenderOutput[];
    middleware?: { config: { matchers?: Array<{ sourceRegex: string }> } };
  };
}
export interface AppConfig {
  distDir: string;
  adapterPath?: string;
  deploymentId?: string;
  basePath?: string;
  i18n?: unknown;
  output?: string;
}
export interface ConfigContext {
  phase: string;
  projectDir: string;
  nextVersion: string;
}
export interface ProviderAdapter {
  name: string;
  modifyConfig?: (config: AppConfig, context: ConfigContext) => Promise<AppConfig> | AppConfig;
  onBuildComplete: (context: BuildContext) => Promise<void> | void;
}
export interface PolicyDefinitions {
  base: Record<string, string[]>;
  ssg?: Record<string, string[]>;
  ssr?: Record<string, string[]>;
}
export interface Options {
  routes: string[];
  errorRoutes?: string[];
  policies: PolicyDefinitions;
  providerAdapter?: ProviderAdapter;
  browserMaxAgeSeconds?: number;
}
export interface DocumentOutput {
  pathname: string;
  filePath: string;
  aliases: string[];
  fallback?: NonNullable<PrerenderOutput['fallback']>;
}
export interface PreparedOutput extends DocumentOutput {
  html: string;
  policy: string;
  scripts: string[];
  styles: string[];
  inputDigest: string;
}
export interface Manifest {
  version: 1;
  buildId: string;
  nextVersion: string;
  optionsDigest: string;
  files: Record<string, string>;
  policies: Record<string, string>;
}
