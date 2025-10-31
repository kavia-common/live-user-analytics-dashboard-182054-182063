export const Theme = {
  palette: {
    name: 'Violet Dreams',
    primary: '#7C3AED',
    secondary: '#0D9488',
    success: '#0D9488',
    error: '#EF4444',
    background: '#f9fafb',
    surface: '#ffffff',
    text: '#111827',
  },
};

// PUBLIC_INTERFACE
export function getStoredTheme() {
  /** Returns 'light' | 'dark' based on localStorage or prefers-color-scheme */
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

// PUBLIC_INTERFACE
export function applyTheme(theme) {
  /** Applies theme to document root */
  const mode = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('theme', mode);
}

// PUBLIC_INTERFACE
export function storeTheme(theme) {
  /** Persist chosen theme */
  localStorage.setItem('theme', theme === 'dark' ? 'dark' : 'light');
}
