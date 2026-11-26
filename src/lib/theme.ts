export const THEME_STORAGE_KEY = 'ml-teaching-theme';
export const supportedColorSchemes = 'light dark';
const THEME_SELECTIONS = ['light', 'dark', 'system'] as const;
export type ThemeSelection = (typeof THEME_SELECTIONS)[number];
export type ResolvedTheme = Exclude<ThemeSelection, 'system'>;
const themeColors = { light: '#faf9fa', dark: '#000000' } as const;

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
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  if (root.dataset.theme !== selection) root.dataset.theme = selection;
  const color = document.getElementById('site-theme-color');
  if (color && color.getAttribute('content') !== themeColors[resolved]) {
    color.setAttribute('content', themeColors[resolved]);
  }
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
export const THEME_BOOTSTRAP_SCRIPT = `(()=>{
  let selection = "system";
  try {
    const saved = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (${JSON.stringify(THEME_SELECTIONS)}.includes(saved)) selection = saved;
  } catch {}
  const dark = selection === "dark" || (selection === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = selection;
  let chromeColor = document.getElementById("site-theme-color");
  if (!chromeColor) {
    chromeColor = document.createElement("meta");
    chromeColor.id = "site-theme-color";
    chromeColor.name = "theme-color";
    document.head.append(chromeColor);
  }
  chromeColor.content = dark ? "${themeColors.dark}" : "${themeColors.light}";
})()`;
