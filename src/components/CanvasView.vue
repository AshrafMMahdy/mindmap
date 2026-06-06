<template>
  <div class="canvas-wrap">
    <div ref="host" class="canvas-host" />

    <!-- structure / history -->
    <div class="tb tb-tl">
      <button class="t-btn" :disabled="!hasActive" title="Add child node (Tab)" @click="engine.addChild()">
        <AppIcon name="plus" :size="16" /> Child
      </button>
      <button class="t-btn" :disabled="!hasActive" title="Add sibling node (Enter)" @click="engine.addSibling()">
        <AppIcon name="plus" :size="16" /> Sibling
      </button>
      <button class="t-icon" :disabled="!hasActive" title="Delete node (Delete)" @click="engine.removeActive()">
        <AppIcon name="trash" :size="16" />
      </button>
      <span class="t-sep" />
      <button class="t-icon" title="Undo (Ctrl+Z)" @click="engine.undo()"><AppIcon name="undo" :size="16" /></button>
      <button class="t-icon" title="Redo (Ctrl+Y)" @click="engine.redo()"><AppIcon name="redo" :size="16" /></button>
    </div>

    <!-- look / export -->
    <div class="tb tb-tr">
      <button class="t-btn" title="Map style" @click="openStyleMenu">
        <AppIcon name="palette" :size="15" /> {{ currentStyleLabel }}
      </button>
      <button class="t-btn" title="Layout" @click="openLayoutMenu">
        <AppIcon name="layout" :size="15" /> {{ currentLayoutLabel }}
      </button>
      <button class="t-btn" title="Export or print this map" @click="openExport">
        <AppIcon name="download" :size="16" /> Export
      </button>
    </div>

    <!-- zoom -->
    <div class="tb tb-br">
      <button class="t-icon" title="Zoom out" @click="engine.zoomOut()"><AppIcon name="zoomOut" :size="16" /></button>
      <button class="t-icon" title="Fit to screen" @click="engine.fit()"><AppIcon name="fit" :size="16" /></button>
      <button class="t-icon" title="Zoom in" @click="engine.zoomIn()"><AppIcon name="zoomIn" :size="16" /></button>
    </div>

    <!-- empty state -->
    <div v-if="ws.loaded && !activeMap" class="empty">
      <svg width="48" height="48" viewBox="0 0 32 32" aria-hidden="true" style="opacity: 0.6">
        <path d="M16 16 7 9M16 16l9-7M16 16l-7 9M16 16l9 8" stroke="var(--text-faint)" stroke-width="1.6" fill="none" stroke-linecap="round" />
        <circle cx="16" cy="16" r="4" fill="var(--text-faint)" />
      </svg>
      <p class="empty-title">No map open</p>
      <p class="empty-sub">Create your first map to start mapping ideas.</p>
      <button class="btn btn-accent" @click="ws.createMap()"><AppIcon name="plus" :size="16" /> New map</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWorkspace } from '../store/workspace'
import { useEngine } from '../engine/useEngine'
import { useTheme } from '../lib/theme'
import { LAYOUT_OPTIONS, STYLE_OPTIONS, variantFor } from '../engine/themes'
import { debounce } from '../lib/debounce'
import { plain } from '../lib/plain'
import { openMenu } from '../lib/menu'
import { exportMapAs, printMap } from '../export/exporters'
import { handleCanvasPaste } from '../paste/pasteHandler'
import AppIcon from './AppIcon.vue'

const ws = useWorkspace()
const { engine, activeNodes } = useEngine()
const { theme } = useTheme()
const host = ref<HTMLElement | null>(null)

const activeMap = computed(() => ws.activeMap)
const hasActive = computed(() => activeNodes.value.length > 0)

const currentStyle = computed(() =>
  STYLE_OPTIONS.some((s) => s.value === activeMap.value?.theme)
    ? (activeMap.value!.theme as string)
    : 'paper',
)
const currentStyleLabel = computed(
  () => STYLE_OPTIONS.find((s) => s.value === currentStyle.value)?.label ?? 'Style',
)
const currentLayoutLabel = computed(
  () => LAYOUT_OPTIONS.find((l) => l.value === activeMap.value?.layout)?.label ?? 'Layout',
)

const save = debounce((id: string, tree: any) => ws.updateMapTree(id, tree), 500)

let resizeObserver: ResizeObserver | null = null

function applyStyle(style: string) {
  ws.setActiveView(style, activeMap.value?.layout ?? engine.getLayout())
  engine.setTheme(variantFor(style, theme.value === 'dark'))
}
function applyLayout(layout: string) {
  engine.setLayout(layout)
  ws.setActiveView(currentStyle.value, layout)
}
function openStyleMenu(e: MouseEvent) {
  openMenu(
    e,
    STYLE_OPTIONS.map((s) => ({
      label: s.label,
      icon: currentStyle.value === s.value ? 'check' : 'circle',
      onClick: () => applyStyle(s.value),
    })),
  )
}
function openLayoutMenu(e: MouseEvent) {
  openMenu(
    e,
    LAYOUT_OPTIONS.map((l) => ({
      label: l.label,
      icon: activeMap.value?.layout === l.value ? 'check' : 'circle',
      onClick: () => applyLayout(l.value),
    })),
  )
}

function openExport(e: MouseEvent) {
  const name = activeMap.value?.name || 'mindmap'
  openMenu(e, [
    { label: 'Export PNG image', icon: 'image', onClick: () => exportMapAs(engine, 'png', name) },
    { label: 'Export PDF document', icon: 'printer', onClick: () => exportMapAs(engine, 'pdf', name) },
    { label: 'Export SVG (vector)', icon: 'layout', onClick: () => exportMapAs(engine, 'svg', name) },
    { label: 'Print…', icon: 'printer', separatorBefore: true, onClick: () => printMap(engine, name) },
  ])
}

let engineMounted = false
function mountEngine() {
  if (engineMounted || !host.value) return
  engineMounted = true
  const m = ws.activeMap
  engine.mount(host.value, {
    data: m ? plain(m.tree) : undefined,
    theme: variantFor(m?.theme, theme.value === 'dark'),
    layout: m?.layout,
  })

  engine.onChange((tree) => {
    const id = ws.activeMapId
    if (id) save(id, tree)
  })
  engine.onActiveNodesChange((nodes) => {
    activeNodes.value = nodes
    ws.onActiveNodesChanged(nodes.length)
  })

  resizeObserver = new ResizeObserver(() => engine.resize())
  resizeObserver.observe(host.value)

  document.addEventListener('paste', onPaste, true)
}

// Mount only once the workspace has loaded, so we render the real active map
// directly instead of a throwaway default root that would ghost behind it.
onMounted(() => {
  if (ws.loaded) mountEngine()
})
watch(
  () => ws.loaded,
  (loaded) => {
    if (loaded) mountEngine()
  },
)

function onPaste(e: ClipboardEvent) {
  void handleCanvasPaste(e, engine)
}

// load the map whenever the active selection changes
watch(
  () => ws.activeMapId,
  (id, prev) => {
    if (id === prev) return
    save.flush()
    const m = ws.activeMap
    if (m) engine.load(plain(m.tree), variantFor(m.theme, theme.value === 'dark'), m.layout)
  },
)

// Toggling app dark/light keeps the chosen map style but swaps the background
// to its light/dark variant. The style picker controls the style in either
// mode; the app mode controls only the background.
watch(theme, (t) => {
  if (!engineMounted) return
  engine.setTheme(variantFor(currentStyle.value, t === 'dark'))
})

onBeforeUnmount(() => {
  save.flush()
  resizeObserver?.disconnect()
  document.removeEventListener('paste', onPaste, true)
  engine.destroy()
})
</script>

<style scoped>
.canvas-wrap { position: relative; height: 100%; overflow: hidden; background: var(--bg); }
.canvas-host { position: absolute; inset: 0; }

.tb {
  position: absolute;
  z-index: 5;
  display: flex; align-items: center; gap: 3px;
  padding: 5px;
  background: color-mix(in srgb, var(--elev) 84%, transparent);
  backdrop-filter: blur(10px) saturate(1.2);
  border: 1px solid var(--border);
  border-radius: 13px;
  box-shadow: var(--shadow-md);
}
.tb-tl { top: 14px; left: 14px; }
.tb-tr { top: 14px; right: 14px; }
.tb-br { bottom: 14px; right: 14px; }

.t-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 11px; border-radius: 9px;
  font-size: 12.5px; font-weight: 500; color: var(--text);
  transition: background 0.13s, color 0.13s, opacity 0.13s;
}
.t-btn:hover { background: var(--surface-2); }
.t-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 9px; color: var(--text-muted);
  transition: background 0.13s, color 0.13s;
}
.t-icon:hover { background: var(--surface-2); color: var(--text); }
.t-btn:disabled, .t-icon:disabled { opacity: 0.34; pointer-events: none; }
.t-sep { width: 1px; height: 18px; background: var(--border); margin: 0 4px; }

.empty {
  position: absolute; inset: 0; z-index: 6;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; background: var(--bg);
}
.empty-title { font-family: var(--font-display); font-size: 21px; margin: 10px 0 0; }
.empty-sub { color: var(--text-muted); margin: 0 0 16px; }
</style>
