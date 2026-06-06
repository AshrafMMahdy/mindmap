<template>
  <div class="left">
    <div class="head">
      <button class="btn btn-accent new-map" @click="newMap"><AppIcon name="plus" :size="17" /> New map</button>
      <button class="icon-btn" title="New project" @click="newProject"><AppIcon name="folderPlus" :size="18" /></button>
    </div>

    <div class="search">
      <AppIcon name="search" :size="15" class="search-icon" />
      <input v-model="ws.search" class="field search-field" placeholder="Search maps…" />
      <button v-if="ws.search" class="icon-btn search-clear" @click="ws.search = ''"><AppIcon name="x" :size="14" /></button>
    </div>

    <div class="scroll list">
      <section v-if="ws.pinnedMaps.length" class="group">
        <div class="group-label"><AppIcon name="pin" :size="12" /><span class="section-label">Pinned</span></div>
        <MapRow v-for="m in ws.pinnedMaps" :key="m.id" :map="m" />
      </section>

      <section
        v-for="p in ws.orderedProjects"
        :key="p.id"
        class="group"
        :class="{ 'drop-target': dragOverId === p.id }"
        @dragover.prevent="dragOverId = p.id"
        @dragleave="onDragLeave(p.id)"
        @drop.prevent="onDrop(p.id, $event)"
      >
        <div class="proj" :class="{ selected: ws.selectedProjectId === p.id && ws.rightMode === 'project' }">
          <button class="proj-toggle" @click.stop="toggle(p.id)">
            <AppIcon :name="isOpen(p) ? 'chevronDown' : 'chevronRight'" :size="15" />
          </button>
          <span class="dot" :style="{ background: p.color }" />
          <input
            v-if="renamingId === p.id"
            ref="renameInput" v-model="renameText" class="rename"
            @keydown.enter.prevent="commitRename" @keydown.esc="cancelRename" @blur="commitRename"
          />
          <button v-else class="proj-name" @click="ws.selectProject(p.id)" @dblclick="startRename(p.id, p.name)">
            {{ p.name }}
          </button>
          <span class="count">{{ countOf(p.id) }}</span>
          <button class="icon-btn tiny" @click.stop="projectMenu($event, p)"><AppIcon name="dots" :size="16" /></button>
        </div>

        <div v-show="isOpen(p)" class="maps">
          <MapRow v-for="m in ws.mapsByProject(p.id)" :key="m.id" :map="m" />
          <div v-if="!ws.mapsByProject(p.id).length" class="empty-hint">No maps yet</div>
        </div>
      </section>

      <section v-if="ws.archivedMaps.length" class="group">
        <button class="group-label as-btn" @click="archivedOpen = !archivedOpen">
          <AppIcon :name="archivedOpen ? 'chevronDown' : 'chevronRight'" :size="13" />
          <AppIcon name="archive" :size="12" />
          <span class="section-label">Archived · {{ ws.archivedMaps.length }}</span>
        </button>
        <div v-show="archivedOpen">
          <MapRow v-for="m in ws.archivedMaps" :key="m.id" :map="m" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useWorkspace } from '../store/workspace'
import { openMenu } from '../lib/menu'
import { confirm } from '../lib/confirm'
import type { Project } from '../types'
import AppIcon from './AppIcon.vue'
import MapRow from './MapRow.vue'

const ws = useWorkspace()

const collapsed = ref<Record<string, boolean>>({})
const archivedOpen = ref(false)
const dragOverId = ref<string | null>(null)

const renamingId = ref<string | null>(null)
const renameText = ref('')
const renameInput = ref<HTMLInputElement | HTMLInputElement[] | null>(null)

function isOpen(p: Project) {
  return !collapsed.value[p.id] || !!ws.search
}
function toggle(id: string) {
  collapsed.value[id] = !collapsed.value[id]
}
function countOf(projectId: string) {
  return ws.maps.filter((m) => m.projectId === projectId && !m.archived).length
}

async function newMap() {
  await ws.createMap()
}
async function newProject() {
  const id = await ws.createProject('New project')
  startRename(id, 'New project')
}

function startRename(id: string, current: string) {
  renamingId.value = id
  renameText.value = current
  nextTick(() => {
    const el = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value
    el?.focus()
    el?.select()
  })
}
function cancelRename() {
  renamingId.value = null
}
async function commitRename() {
  if (!renamingId.value) return
  const id = renamingId.value
  const name = renameText.value.trim()
  renamingId.value = null
  if (name) await ws.renameProject(id, name)
}

function onDragLeave(id: string) {
  if (dragOverId.value === id) dragOverId.value = null
}
async function onDrop(projectId: string, e: DragEvent) {
  dragOverId.value = null
  const id = e.dataTransfer?.getData('text/plain')
  if (id) await ws.moveMap(id, projectId)
}

async function onDeleteProject(p: Project) {
  const n = countOf(p.id)
  const ok = await confirm({
    title: `Delete project “${p.name}”?`,
    message: n ? `${n} map(s) inside will also be deleted.` : 'This project is empty.',
    confirmLabel: 'Delete',
    danger: true,
  })
  if (ok) await ws.deleteProject(p.id)
}
function projectMenu(e: MouseEvent, p: Project) {
  openMenu(e, [
    { label: 'New map here', icon: 'plus', onClick: () => ws.createMap(p.id) },
    { label: 'Rename', icon: 'edit', onClick: () => startRename(p.id, p.name) },
    { label: 'Edit notes', icon: 'note', onClick: () => ws.selectProject(p.id) },
    { label: 'Delete project', icon: 'trash', danger: true, separatorBefore: true, onClick: () => onDeleteProject(p) },
  ])
}
</script>

<style scoped>
.left { display: flex; flex-direction: column; height: 100%; }
.head { display: flex; gap: 7px; padding: 12px 12px 8px; }
.new-map { flex: 1; height: 38px; font-size: 13.5px; }
.search { position: relative; padding: 0 12px 10px; }
.search-icon { position: absolute; left: 23px; top: 17px; color: var(--text-faint); }
.search-field { padding-left: 32px; padding-right: 30px; height: 34px; }
.search-clear { position: absolute; right: 15px; top: 1px; width: 28px; height: 32px; }

.list { flex: 1; padding: 4px 8px 16px; }
.group { margin-bottom: 6px; border-radius: var(--radius); padding: 2px; border: 1px solid transparent; transition: border-color 0.15s, background 0.15s; }
.group.drop-target { border-color: var(--accent-line); background: var(--accent-soft); }
.group-label { display: flex; align-items: center; gap: 6px; padding: 8px 8px 4px; color: var(--text-faint); }
.group-label.as-btn { width: 100%; }
.group-label.as-btn:hover .section-label { color: var(--text-muted); }

.proj { display: flex; align-items: center; gap: 2px; padding: 4px 4px 4px 2px; border-radius: var(--radius-sm); }
.proj.selected { background: var(--accent-soft); }
.proj-toggle { display: inline-flex; width: 22px; height: 26px; align-items: center; justify-content: center; color: var(--text-faint); border-radius: 6px; }
.proj-toggle:hover { color: var(--text); }
.dot { width: 9px; height: 9px; border-radius: 3px; flex: none; margin-right: 4px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06); }
.proj-name { flex: 1; text-align: left; font-weight: 600; font-size: 13px; color: var(--text); padding: 2px 0; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.count { font-family: var(--font-mono); font-size: 10.5px; color: var(--text-faint); padding: 0 4px; }
.icon-btn.tiny { width: 26px; height: 26px; }
.empty-hint { padding: 4px 0 6px 20px; color: var(--text-faint); font-size: 12px; font-style: italic; }
.rename {
  flex: 1; height: 26px; padding: 0 8px; margin-left: 2px;
  border: 1px solid var(--accent); border-radius: 6px;
  background: var(--elev); color: var(--text); font-size: 13px;
}
.rename:focus { outline: none; box-shadow: 0 0 0 3px var(--accent-soft); }
</style>
