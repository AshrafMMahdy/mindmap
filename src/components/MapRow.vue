<template>
  <div v-if="renaming" class="map-row renaming">
    <input
      ref="input" v-model="text" class="rename"
      @keydown.enter.prevent="commit" @keydown.esc="cancel" @blur="commit"
    />
  </div>
  <div
    v-else
    class="map-row"
    :class="{ active: ws.activeMapId === map.id }"
    draggable="true"
    @click="ws.setActiveMap(map.id)"
    @dblclick="start"
    @contextmenu="menu"
    @dragstart="onDragStart"
  >
    <AppIcon :name="map.archived ? 'archive' : 'circle'" :size="7" :stroke="3" class="map-bullet" />
    <span class="map-name">{{ map.name }}</span>
    <AppIcon v-if="map.pinned && !map.archived" name="pin" :size="13" class="map-pin" />
    <button class="icon-btn tiny row-menu" @click.stop="menu"><AppIcon name="dots" :size="15" /></button>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useWorkspace } from '../store/workspace'
import { openMenu } from '../lib/menu'
import { confirm } from '../lib/confirm'
import type { MapDoc } from '../types'
import AppIcon from './AppIcon.vue'

const props = defineProps<{ map: MapDoc }>()
const ws = useWorkspace()

const renaming = ref(false)
const text = ref('')
const input = ref<HTMLInputElement | null>(null)

function start() {
  renaming.value = true
  text.value = props.map.name
  nextTick(() => {
    input.value?.focus()
    input.value?.select()
  })
}
function cancel() {
  renaming.value = false
}
async function commit() {
  if (!renaming.value) return
  const name = text.value.trim()
  renaming.value = false
  if (name && name !== props.map.name) await ws.renameMap(props.map.id, name)
}

function onDragStart(e: DragEvent) {
  e.dataTransfer?.setData('text/plain', props.map.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

async function del() {
  const ok = await confirm({
    title: `Delete “${props.map.name}”?`,
    message: 'This map will be permanently removed.',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (ok) await ws.deleteMap(props.map.id)
}

function menu(e: MouseEvent) {
  const m = props.map
  const others = ws.orderedProjects.filter((p) => p.id !== m.projectId)
  openMenu(e, [
    { label: 'Rename', icon: 'edit', onClick: start },
    { label: 'Duplicate', icon: 'copy', onClick: () => ws.duplicateMap(m.id) },
    { label: m.pinned ? 'Unpin' : 'Pin to top', icon: 'pin', onClick: () => ws.togglePin(m.id) },
    { label: m.archived ? 'Restore' : 'Archive', icon: m.archived ? 'unarchive' : 'archive', onClick: () => ws.toggleArchive(m.id) },
    ...others.map((p, i) => ({
      label: `Move to “${p.name}”`,
      icon: 'move',
      separatorBefore: i === 0,
      onClick: () => ws.moveMap(m.id, p.id),
    })),
    { label: 'Delete', icon: 'trash', danger: true, separatorBefore: true, onClick: del },
  ])
}
</script>

<style scoped>
.map-row {
  display: flex; align-items: center; gap: 8px;
  margin: 1px 0 1px 8px; padding: 6px 6px 6px 10px;
  border-radius: var(--radius-sm); cursor: pointer;
  border-left: 2px solid transparent;
  transition: background 0.13s, border-color 0.13s;
}
.map-row:hover { background: var(--surface-2); }
.map-row.active { background: var(--accent-soft); border-left-color: var(--accent); }
.map-bullet { color: var(--text-faint); flex: none; }
.map-row.active .map-bullet { color: var(--accent); }
.map-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.map-pin { color: var(--clay); flex: none; }
.row-menu { opacity: 0; }
.map-row:hover .row-menu { opacity: 1; }
.icon-btn.tiny { width: 26px; height: 26px; }
.renaming { padding-left: 10px; }
.rename {
  flex: 1; height: 26px; padding: 0 8px;
  border: 1px solid var(--accent); border-radius: 6px;
  background: var(--elev); color: var(--text); font-size: 13px;
}
.rename:focus { outline: none; box-shadow: 0 0 0 3px var(--accent-soft); }
</style>
