export const THEME_STORAGE_KEY = 'ml-teaching-theme';
const THEME_SELECTIONS = ['light', 'dark', 'system'] as const;
export type ThemeSelection = (typeof THEME_SELECTIONS)[number];
export type ResolvedTheme = Exclude<ThemeSelection, 'system'>;

export function parseTheme(value: unknown): ThemeSelection | null {
  return THEME_SELECTIONS.includes(value as ThemeSelection) ? (value as ThemeSelection) : null;
}

export function resolveTheme(selection: ThemeSelection, systemDark: boolean): ResolvedTheme {
  return selection === 'system' ? (systemDark ? 'dark' : 'light') : selection;
}

export function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(selection: ThemeSelection, resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.dataset.theme = selection;
  document.getElementById('site-favicon')?.setAttribute('href', `/favicon-${resolved}.svg`);
}

export function readRememberedTheme(): ThemeSelection | null {
  try {
    return parseTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return null;
  }
}

/** Only explicit preference handlers call this; default/system/storage events never write. */
export function rememberTheme(selection: ThemeSelection | null): boolean {
  if (selection !== null && parseTheme(selection) === null) return false;
  try {
    if (selection) window.localStorage.setItem(THEME_STORAGE_KEY, selection);
    else window.localStorage.removeItem(THEME_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Trusted build-known script, shared by App Router and the native static error document. */
export const THEME_BOOTSTRAP_SCRIPT = `(()=>{let t="system";try{const v=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(THEME_SELECTIONS)}.includes(v))t=v}catch{}const d=t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.dataset.theme=t;document.getElementById("site-favicon")?.setAttribute("href",d?"/favicon-dark.svg":"/favicon-light.svg")})()`;
