import defaultTheme from 'simple-mind-map/src/theme/default.js'

// The npm core ships only the `default` theme, so we register our own. Each map
// "style" (Paper / Blueprint / Classic) has a LIGHT and a DARK variant. The
// picker chooses the style; the app's light/dark mode chooses the variant. So
// the node styling stays consistent across modes while the background follows
// the app theme (no bright canvas in dark mode).

const FONT = '"Hanken Grotesk Variable", system-ui, sans-serif'
const DARK_BG = '#141318'
const DARK_SURFACE = '#23222b'

type ThemeConfig = Record<string, any>

function make(overrides: ThemeConfig): ThemeConfig {
  const base = defaultTheme as ThemeConfig
  return {
    ...base,
    lineWidth: 2,
    lineStyle: 'curve',
    ...overrides,
    root: { ...base.root, fontFamily: FONT, fontSize: 17, borderRadius: 11, ...(overrides.root || {}) },
    second: { ...base.second, fontFamily: FONT, borderWidth: 1.4, borderRadius: 9, ...(overrides.second || {}) },
    node: { ...base.node, fontFamily: FONT, ...(overrides.node || {}) },
    generalization: { ...base.generalization, fontFamily: FONT, ...(overrides.generalization || {}) },
  }
}

export const THEMES: Record<string, ThemeConfig> = {
  // ---- Paper: warm, pine-green accent ----
  paper: make({
    backgroundColor: '#f6f2e8',
    lineColor: '#cbab8d',
    root: { fillColor: '#1c6b53', color: '#fbf7ec' },
    second: { fillColor: '#fffdf8', color: '#39342b', borderColor: '#1c6b53' },
    node: { color: '#5a5244' },
    generalization: { fillColor: '#fffdf8', color: '#39342b', borderColor: '#bd643a' },
  }),
  paperDark: make({
    backgroundColor: DARK_BG,
    lineColor: '#6f8f84',
    root: { fillColor: '#1c6b53', color: '#f3efe6' },
    second: { fillColor: DARK_SURFACE, color: '#ece7df', borderColor: '#2f8f70' },
    node: { color: '#b8b2a8' },
    generalization: { fillColor: DARK_SURFACE, color: '#ece7df', borderColor: '#c0784f' },
  }),

  // ---- Blueprint: cool, navy/blue accent ----
  blueprint: make({
    backgroundColor: '#eaf0f6',
    lineColor: '#8aa3bd',
    root: { fillColor: '#244e72', color: '#eef4fb' },
    second: { fillColor: '#ffffff', color: '#23323f', borderColor: '#244e72' },
    node: { color: '#4a5a69' },
    generalization: { fillColor: '#ffffff', color: '#23323f', borderColor: '#3f7fb0' },
  }),
  blueprintDark: make({
    backgroundColor: DARK_BG,
    lineColor: '#5b7790',
    root: { fillColor: '#2f5d86', color: '#eef4fb' },
    second: { fillColor: DARK_SURFACE, color: '#e7ecf2', borderColor: '#3f6f9b' },
    node: { color: '#aab6c2' },
    generalization: { fillColor: DARK_SURFACE, color: '#e7ecf2', borderColor: '#5b8fb8' },
  }),

  // ---- Classic: neutral, teal accent (the library's signature look) ----
  classic: make({
    backgroundColor: '#fafaf7',
    lineColor: '#549688',
    root: { fillColor: '#549688', color: '#ffffff' },
    second: { fillColor: '#ffffff', color: '#565656', borderColor: '#549688' },
    node: { color: '#6a6d6c' },
    generalization: { fillColor: '#ffffff', color: '#565656', borderColor: '#549688' },
  }),
  classicDark: make({
    backgroundColor: DARK_BG,
    lineColor: '#4f8276',
    root: { fillColor: '#549688', color: '#ffffff' },
    second: { fillColor: DARK_SURFACE, color: '#e7e2da', borderColor: '#4f8c7e' },
    node: { color: '#b3b6b3' },
    generalization: { fillColor: DARK_SURFACE, color: '#e7e2da', borderColor: '#4f8c7e' },
  }),
}

export interface StyleOption {
  value: string
  label: string
}

/** The user-facing map styles. Background follows the app light/dark mode. */
export const STYLE_OPTIONS: StyleOption[] = [
  { value: 'paper', label: 'Paper' },
  { value: 'blueprint', label: 'Blueprint' },
  { value: 'classic', label: 'Classic' },
]

/** Resolve a stored style + the current mode to a registered theme name. */
export function variantFor(style: string | undefined, isDark: boolean): string {
  const base = STYLE_OPTIONS.some((s) => s.value === style) ? (style as string) : 'paper'
  return isDark ? `${base}Dark` : base
}

export interface LayoutOption {
  value: string
  label: string
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { value: 'logicalStructure', label: 'Logical →' },
  { value: 'logicalStructureLeft', label: 'Logical ←' },
  { value: 'mindMap', label: 'Mind map' },
  { value: 'organizationStructure', label: 'Org chart' },
  { value: 'catalogOrganization', label: 'Catalog' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'fishbone', label: 'Fishbone' },
]

export const DEFAULT_THEME = 'paper'
export const DEFAULT_LAYOUT = 'logicalStructure'
