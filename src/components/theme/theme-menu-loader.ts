import { loadSiteMenus } from '../site-menu-loader';

export async function loadThemeMenu() {
  const { ThemeMenu } = await loadSiteMenus();
  return { ThemeMenu };
}
