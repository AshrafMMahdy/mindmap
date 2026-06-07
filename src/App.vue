<template>
  <div class="app" :class="{ 'right-open': ws.rightMode !== 'empty' }">
    <header class="topbar reveal">
      <div class="brand">
        <svg class="mark" width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 16 7 9M16 16l9-7M16 16l-7 9M16 16l9 8" stroke="var(--accent)" stroke-width="1.7" fill="none" stroke-linecap="round" />
          <circle cx="16" cy="16" r="4.4" fill="var(--accent)" />
          <circle cx="7" cy="9" r="2.4" fill="var(--clay)" />
          <circle cx="25" cy="9" r="2.4" fill="var(--text)" opacity="0.55" />
          <circle cx="9" cy="25" r="2.4" fill="var(--text)" opacity="0.55" />
          <circle cx="25" cy="24" r="2.4" fill="var(--clay)" />
        </svg>
        <span class="wordmark">MindMap</span>
      </div>

      <div class="crumb" v-if="ws.activeMap">
        <span class="crumb-project">{{ activeProjectName }}</span>
        <AppIcon name="chevronRight" :size="14" class="crumb-sep" />
        <span class="crumb-map">{{ ws.activeMap.name }}</span>
      </div>

      <div class="top-actions">
        <button class="btn btn-ghost" @click="onImportClick" title="Import a workspace .json">
          <AppIcon name="upload" :size="16" /> Import
        </button>
        <button class="btn btn-ghost" @click="onExport" title="Export the whole workspace to .json">
          <AppIcon name="download" :size="16" /> Export
        </button>
        <span class="divider" />
        <button class="icon-btn" @click="toggleTheme" :title="theme === 'dark' ? 'Light mode' : 'Dark mode'">
          <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="18" />
        </button>
      </div>
    </header>

    <div class="body" :class="{ resizing: isResizing }">
      <LeftSidebar class="pane pane-left reveal" style="animation-delay: 0.05s" />
      <div
        class="resize-h left-h"
        title="Drag to resize · double-click to reset"
        @pointerdown="startResize('left', $event)"
        @dblclick="resetLeft()"
      />
      <CanvasView class="pane pane-center reveal" style="animation-delay: 0.1s" />
      <RightSidebar class="pane pane-right" />
      <div
        v-if="ws.rightMode !== 'empty'"
        class="resize-h right-h"
        title="Drag to resize · double-click to reset"
        @pointerdown="startResize('right', $event)"
        @dblclick="resetRight()"
      />
    </div>

    <input ref="fileInput" type="file" accept="application/json,.json" hidden @change="onImportFile" />

    <ContextMenuHost />
    <ConfirmHost />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useWorkspace } from './store/workspace'
import LeftSidebar from './components/LeftSidebar.vue'
import CanvasView from './components/CanvasView.vue'
import RightSidebar from './components/RightSidebar.vue'
import ContextMenuHost from './components/ContextMenuHost.vue'
import ConfirmHost from './components/ConfirmHost.vue'
import AppIcon from './components/AppIcon.vue'
import { confirm } from './lib/confirm'
import { useTheme } from './lib/theme'
import { useSidebars } from './lib/sidebars'
import {
  downloadWorkspace,
  exportWorkspace,
  importWorkspaceFromFile,
} from './storage/workspaceIO'

const ws = useWorkspace()

const activeProjectName = computed(
  () => ws.projects.find((p) => p.id === ws.activeMap?.projectId)?.name ?? '',
)

// ---- theme (shared via composable so the canvas follows it too) ----
const { theme, toggle: toggleTheme, init: initTheme } = useTheme()

// ---- resizable sidebars ----
const { leftW, rightW, init: initSidebars, setLeft, setRight, resetLeft, resetRight } = useSidebars()
const isResizing = ref(false)
function startResize(side: 'left' | 'right', e: PointerEvent) {
  e.preventDefault()
  isResizing.value = true
  const startX = e.clientX
  const startW = side === 'left' ? leftW.value : rightW.value
  const onMove = (ev: PointerEvent) => {
    const dx = ev.clientX - startX
    if (side === 'left') setLeft(startW + dx)
    else setRight(startW - dx)
  }
  const onUp = () => {
    isResizing.value = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'
}

// ---- workspace import / export ----
const fileInput = ref<HTMLInputElement | null>(null)
async function onExport() {
  downloadWorkspace(await exportWorkspace())
}
function onImportClick() {
  fileInput.value?.click()
}
async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const proceed = await confirm({
    title: 'Import workspace',
    message: `Merge "${file.name}" into your current workspace? Existing maps are kept.`,
    confirmLabel: 'Merge',
  })
  if (!proceed) return
  try {
    const res = await importWorkspaceFromFile(file, 'merge')
    await ws.reload()
    await confirm({
      title: 'Import complete',
      message: `Added ${res.projects} project(s) and ${res.maps} map(s).`,
      confirmLabel: 'Done',
      cancelLabel: 'Close',
    })
  } catch (err) {
    await confirm({
      title: 'Import failed',
      message: err instanceof Error ? err.message : String(err),
      confirmLabel: 'OK',
      cancelLabel: 'Close',
    })
  }
}

onMounted(() => {
  initTheme()
  initSidebars()
  ws.init()
})
</script>

<style scoped>
.app {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: var(--topbar-h) 1fr;
  height: 100%;
}

.topbar {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 14px;
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; gap: 9px; justify-self: start; }
.mark { flex: none; }
.wordmark { font-family: var(--font-display); font-size: 20px; font-weight: 600; letter-spacing: -0.015em; }

.crumb {
  justify-self: center;
  display: flex; align-items: center; gap: 7px;
  max-width: 46vw; overflow: hidden;
  color: var(--text-muted); font-size: 13px;
}
.crumb-sep { color: var(--text-faint); }
.crumb-map { color: var(--text); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.top-actions { justify-self: end; display: flex; align-items: center; gap: 4px; }
.divider { width: 1px; height: 22px; background: var(--border); margin: 0 6px; }

.body {
  position: relative;
  display: grid;
  grid-template-columns: var(--left-w) minmax(0, 1fr) 0px;
  min-height: 0;
  transition: grid-template-columns 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}
.app.right-open .body { grid-template-columns: var(--left-w) minmax(0, 1fr) var(--right-w); }
.body.resizing { transition: none; }

/* drag handles sitting over the pane boundaries */
.resize-h {
  position: absolute; top: 0; bottom: 0; width: 9px; z-index: 7;
  cursor: col-resize; touch-action: none;
}
.left-h { left: calc(var(--left-w) - 4px); }
.right-h { right: calc(var(--right-w) - 4px); }
.resize-h::after {
  content: ''; position: absolute; top: 0; bottom: 0; left: 4px; width: 2px;
  background: transparent; transition: background 0.15s;
}
.resize-h:hover::after, .body.resizing .resize-h::after { background: var(--accent); }

.pane { min-width: 0; min-height: 0; }
.pane-left { border-right: 1px solid var(--border); background: var(--surface); }
.pane-right { overflow: hidden; }

@media (max-width: 860px) {
  .crumb { display: none; }
}
</style>
