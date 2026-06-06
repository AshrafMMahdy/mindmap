import defaultTheme from 'simple-mind-map/src/theme/default.js'

// The npm core ships only the `default` theme, so we register our own — tuned to
// the app's "engineering notebook" look. Each is built on top of the real
// default config so every required key is present.

const FONT = '"Hanken Grotesk Variable", system-ui, sans-serif'

type ThemeConfig = Record<string, any>

function make(overrides: ThemeConfig): ThemeConfig {
  const base = defaultTheme as ThemeConfig
  return {
    ...base,
    ...overrides,
    root: { ...base.root, ...(overrides.root || {}) },
    second: { ...base.second, ...(overrides.second || {}) },
    node: { ...base.node, ...(overrides.node || {}) },
    generalization: { ...base.generalization, ...(overrides.generalization || {}) },
  }
}

export const CUSTOM_THEMES: Record<string, ThemeConfig> = {
  paper: make({
    backgroundColor: '#f6f2e8',
    lineColor: '#cbab8d',
    lineWidth: 2,
    lineStyle: 'curve',
    root: { fillColor: '#1c6b53', color: '#fbf7ec', borderRadius: 11, fontFamily: FONT, fontSize: 17 },
    second: { fillColor: '#fffdf8', color: '#39342b', borderColor: '#1c6b53', borderWidth: 1.4, borderRadius: 9, fontFamily: FONT },
    node: { color: '#5a5244', fontFamily: FONT },
    generalization: { fillColor: '#fffdf8', color: '#39342b', borderColor: '#bd643a', fontFamily: FONT },
  }),
  midnight: make({
    backgroundColor: '#15141a',
    lineColor: '#3f7d6c',
    lineWidth: 2,
    lineStyle: 'curve',
    root: { fillColor: '#49b791', color: '#08130f', borderRadius: 11, fontFamily: FONT, fontSize: 17 },
    second: { fillColor: '#23222b', color: '#e7e2da', borderColor: '#49b791', borderWidth: 1.4, borderRadius: 9, fontFamily: FONT },
    node: { color: '#b8b2a8', fontFamily: FONT },
    generalization: { fillColor: '#23222b', color: '#e7e2da', borderColor: '#e08a5b', fontFamily: FONT },
  }),
  blueprint: make({
    backgroundColor: '#eaf0f6',
    lineColor: '#8aa3bd',
    lineWidth: 2,
    lineStyle: 'curve',
    root: { fillColor: '#244e72', color: '#eef4fb', borderRadius: 11, fontFamily: FONT, fontSize: 17 },
    second: { fillColor: '#ffffff', color: '#23323f', borderColor: '#244e72', borderWidth: 1.4, borderRadius: 9, fontFamily: FONT },
    node: { color: '#4a5a69', fontFamily: FONT },
    generalization: { fillColor: '#ffffff', color: '#23323f', borderColor: '#3f7fb0', fontFamily: FONT },
  }),
}

export interface ThemeOption {
  value: string
  label: string
  dark: boolean
}

export const THEME_OPTIONS: ThemeOption[] = [
  { value: 'paper', label: 'Paper', dark: false },
  { value: 'blueprint', label: 'Blueprint', dark: false },
  { value: 'midnight', label: 'Midnight', dark: true },
  { value: 'default', label: 'Classic', dark: false },
]

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
