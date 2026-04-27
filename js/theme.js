/**
 * Theme switcher: Theme A (Indigo Scholar / Light) ↔ Theme B (Neural Core / Dark)
 * Persists preference in localStorage. Prevents FOUC via inline script in <head>.
 */
const THEME_KEY = 'bigdata_theme';
const themeLink = document.getElementById('theme-css');

function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'a';
}

function setTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
  themeLink.href = `css/theme-${theme}.css`;
  document.documentElement.setAttribute('data-theme', theme);
  updateToggleIcon(theme);
}

function toggleTheme() {
  setTheme(getTheme() === 'a' ? 'b' : 'a');
}

function updateToggleIcon(theme) {
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  btn.textContent = theme === 'a' ? '\u{1F319}' : '\u{2600}\u{FE0F}';
  btn.setAttribute('aria-label',
    theme === 'a' ? 'Switch to Dark Theme' : 'Switch to Light Theme');
}

document.addEventListener('DOMContentLoaded', () => {
  updateToggleIcon(getTheme());
  const btn = document.querySelector('.theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
});
