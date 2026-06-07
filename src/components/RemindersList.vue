<template>
  <section v-if="items.length" class="group">
    <button class="group-label as-btn" @click="open = !open">
      <AppIcon :name="open ? 'chevronDown' : 'chevronRight'" :size="13" />
      <AppIcon name="bell" :size="12" />
      <span class="section-label">Reminders · {{ items.length }}</span>
    </button>
    <div v-show="open" class="rem-list">
      <button v-for="r in items" :key="r.id" class="rem" :class="statusOf(r)" @click="go(r)">
        <span class="rem-when">{{ label(r) }}</span>
        <span class="rem-path">{{ pathOf(r) }}</span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWorkspace } from '../store/workspace'
import { formatReminder, reminderStatus } from '../lib/datetime'
import type { Reminder } from '../types'
import AppIcon from './AppIcon.vue'

const ws = useWorkspace()
const open = ref(true)
const items = computed(() => ws.orderedReminders)

function label(r: Reminder) {
  return formatReminder(r.due, r.hasTime)
}
function statusOf(r: Reminder) {
  return reminderStatus(r.due, r.hasTime)
}
function pathOf(r: Reminder) {
  const project = ws.projects.find((p) => p.id === r.projectId)?.name ?? '—'
  const map = ws.maps.find((m) => m.id === r.mapId)?.name ?? '—'
  return `${project} › ${map} › ${r.nodeText || 'node'}`
}
function go(r: Reminder) {
  ws.requestFocus(r.mapId, r.nodeUid)
}
</script>

<style scoped>
.group { margin-bottom: 6px; padding: 2px; }
.group-label { display: flex; align-items: center; gap: 6px; padding: 8px 8px 4px; color: var(--text-faint); width: 100%; }
.group-label:hover .section-label { color: var(--text-muted); }
.rem-list { display: flex; flex-direction: column; gap: 1px; }
.rem {
  display: flex; flex-direction: column; gap: 1px;
  margin: 1px 6px; padding: 6px 9px;
  border-radius: var(--radius-sm); cursor: pointer; text-align: left;
  border-left: 2px solid transparent;
  transition: background 0.13s;
}
.rem:hover { background: var(--surface-2); }
.rem-when { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
.rem-path {
  font-size: 12.5px; color: var(--text);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rem.overdue { border-left-color: var(--danger); }
.rem.overdue .rem-when { color: var(--danger); }
.rem.today { border-left-color: var(--accent); }
.rem.today .rem-when { color: var(--accent); }
</style>
