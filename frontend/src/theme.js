/**
 * Shared theme engine for the senior-portal app.
 *
 * Import { applyTheme, getStoredTheme } wherever a page needs to read or
 * change the theme. Colors are applied as CSS custom properties on
 * document.documentElement, so every page that styles itself with
 * var(--sp-xxx) picks up the change instantly and it persists across
 * route changes (it's stored on the root element itself, not per-page
 * component state).
 */

export const THEME_PRESETS = {
  light: {
    '--sp-bg': '#F5F7FA',
    '--sp-card': '#FFFFFF',
    '--sp-navy': '#173B5E',
    '--sp-navyDark': '#0F2A44',
    '--sp-gold': '#E3A73D',
    '--sp-goldTint': '#FBF0DA',
    '--sp-green': '#2F7D53',
    '--sp-greenTint': '#E8F5EC',
    '--sp-red': '#C0392B',
    '--sp-redTint': '#FCEAE8',
    '--sp-border': '#DCE3EC',
    '--sp-text': '#1C2B3A',
    '--sp-textMuted': '#51637A',
    '--sp-onNavy': '#FFFFFF',
  },
  dark: {
    '--sp-bg': '#101B2A',
    '--sp-card': '#182A3F',
    '--sp-navy': '#3E7CB1',
    '--sp-navyDark': '#EAF2FB',
    '--sp-gold': '#F0B94E',
    '--sp-goldTint': '#3A2F16',
    '--sp-green': '#4CAF7D',
    '--sp-greenTint': '#193226',
    '--sp-red': '#E8695C',
    '--sp-redTint': '#3A1E1B',
    '--sp-border': '#30475E',
    '--sp-text': '#EAF0F6',
    '--sp-textMuted': '#A9B7C6',
    '--sp-onNavy': '#FFFFFF',
  },
  'high-contrast': {
    '--sp-bg': '#000000',
    '--sp-card': '#000000',
    '--sp-navy': '#FFFF00',
    '--sp-navyDark': '#FFFF00',
    '--sp-gold': '#00FFFF',
    '--sp-goldTint': '#003333',
    '--sp-green': '#00FF00',
    '--sp-greenTint': '#002B00',
    '--sp-red': '#FF5555',
    '--sp-redTint': '#330000',
    '--sp-border': '#FFFF00',
    '--sp-text': '#FFFFFF',
    '--sp-textMuted': '#FFFF00',
    '--sp-onNavy': '#000000',
  },
};

export function applyTheme(themeKey) {
  const preset = THEME_PRESETS[themeKey] || THEME_PRESETS.light;
  const root = document.documentElement;
  Object.entries(preset).forEach(([varName, value]) => {
    root.style.setProperty(varName, value);
  });
  document.body.setAttribute('data-theme', themeKey);
  localStorage.setItem('app_theme', themeKey);
}

export function getStoredTheme() {
  return localStorage.getItem('app_theme') || 'light';
}