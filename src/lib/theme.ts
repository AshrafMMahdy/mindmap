import { ref } from 'vue'

export type Theme = 'light' | 'dark'

// Shared app theme (light/dark) so both the chrome and the canvas follow it.
const theme = ref<Theme>('light')

function apply(t: Theme) {
  document.documentElement.dataset.theme = t
  localStorage.setItem('mm-theme', t)
  theme.value = t
}

function init() {
  const saved = localStorage.getItem('mm-theme') as Theme | null
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  apply(saved ?? (prefersDark ? 'dark' : 'light'))
}

function toggle() {
  apply(theme.value === 'light' ? 'dark' : 'light')
}

export function useTheme() {
  return { theme, apply, init, toggle }
}
