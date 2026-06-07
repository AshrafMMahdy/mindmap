import { ref, watch } from 'vue'

// Persisted, clamped sidebar widths, applied as CSS variables on <html> so the
// App grid (var(--left-w) / var(--right-w)) reacts. The right pane still
// collapses to 0 when empty (handled in App.vue); this controls its open width.

const LEFT_KEY = 'mm-left-w'
const RIGHT_KEY = 'mm-right-w'
const LEFT_DEFAULT = 266
const RIGHT_DEFAULT = 344
const LEFT_MIN = 200
const LEFT_MAX = 460
const RIGHT_MIN = 280
const RIGHT_MAX = 600

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

const leftW = ref(LEFT_DEFAULT)
const rightW = ref(RIGHT_DEFAULT)

function applyVar(name: string, value: number) {
  document.documentElement.style.setProperty(name, `${value}px`)
}

watch(leftW, (v) => {
  applyVar('--left-w', v)
  localStorage.setItem(LEFT_KEY, String(v))
})
watch(rightW, (v) => {
  applyVar('--right-w', v)
  localStorage.setItem(RIGHT_KEY, String(v))
})

export function useSidebars() {
  function init() {
    const l = Number(localStorage.getItem(LEFT_KEY))
    const r = Number(localStorage.getItem(RIGHT_KEY))
    if (l) leftW.value = clamp(l, LEFT_MIN, LEFT_MAX)
    if (r) rightW.value = clamp(r, RIGHT_MIN, RIGHT_MAX)
    applyVar('--left-w', leftW.value)
    applyVar('--right-w', rightW.value)
  }
  return {
    leftW,
    rightW,
    init,
    setLeft: (v: number) => (leftW.value = clamp(v, LEFT_MIN, LEFT_MAX)),
    setRight: (v: number) => (rightW.value = clamp(v, RIGHT_MIN, RIGHT_MAX)),
    resetLeft: () => (leftW.value = LEFT_DEFAULT),
    resetRight: () => (rightW.value = RIGHT_DEFAULT),
  }
}
