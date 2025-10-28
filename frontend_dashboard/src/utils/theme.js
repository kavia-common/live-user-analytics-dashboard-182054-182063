export const VioletDreams = {
  name: "Violet Dreams",
  colors: {
    primary: "#7C3AED",
    secondary: "#0D9488",
    success: "#0D9488",
    error: "#EF4444",
    background: "#f9fafb",
    surface: "#ffffff",
    text: "#111827",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    surfaceDark: "#111827",
    backgroundDark: "#0f1115",
    textDark: "#F9FAFB",
    borderDark: "#1f2937"
  },
};

export function applyTheme(mode = "light") {
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  const c = VioletDreams.colors;
  if (mode === "dark") {
    root.style.setProperty("--bg", c.backgroundDark);
    root.style.setProperty("--surface", "#0b0e14");
    root.style.setProperty("--text", c.textDark);
    root.style.setProperty("--muted", "#9CA3AF");
    root.style.setProperty("--border", c.borderDark);
  } else {
    root.style.setProperty("--bg", c.background);
    root.style.setProperty("--surface", c.surface);
    root.style.setProperty("--text", c.text);
    root.style.setProperty("--muted", c.textMuted);
    root.style.setProperty("--border", c.border);
  }
  root.style.setProperty("--primary", c.primary);
  root.style.setProperty("--secondary", c.secondary);
  root.style.setProperty("--success", c.success);
  root.style.setProperty("--error", c.error);
}

export function getStoredTheme() {
  return localStorage.getItem("theme") || "light";
}

export function storeTheme(mode) {
  localStorage.setItem("theme", mode);
}
