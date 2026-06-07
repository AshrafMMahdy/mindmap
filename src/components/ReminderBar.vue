<template>
  <div class="reminder">
    <div class="r-row">
      <AppIcon name="bell" :size="15" class="r-ico" />
      <span class="r-title">Reminder</span>
      <span v-if="existing" class="r-chip" :class="statusClass">
        {{ formatReminder(existing.due, existing.hasTime) }}
        <button class="r-clear" title="Clear reminder" @click="clear"><AppIcon name="x" :size="12" /></button>
      </span>
    </div>
    <div class="r-edit">
      <input v-model="dateV" type="date" class="field r-date" />
      <input v-model="timeV" type="time" class="field r-time" :disabled="!dateV" title="Optional time" />
      <button class="btn r-set" :disabled="!dateV" @click="save">{{ existing ? 'Update' : 'Set' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useWorkspace } from '../store/workspace'
import { useEngine } from '../engine/useEngine'
import { formatReminder, reminderInputs, reminderStatus, toDue } from '../lib/datetime'
import AppIcon from './AppIcon.vue'

const ws = useWorkspace()
const { activeNodes } = useEngine()

const node = computed(() => (activeNodes.value.length === 1 ? activeNodes.value[0] : null))
const map = computed(() => ws.activeMap)
const existing = computed(() =>
  node.value && map.value ? ws.reminderFor(map.value.id, node.value.uid) : null,
)
const statusClass = computed(() => (existing.value ? reminderStatus(existing.value.due, existing.value.hasTime) : ''))

const dateV = ref('')
const timeV = ref('')

watch(
  existing,
  (r) => {
    const i = reminderInputs(r?.due ?? null, r?.hasTime ?? false)
    dateV.value = i.date
    timeV.value = i.time
  },
  { immediate: true },
)

async function save() {
  const n = node.value
  const m = map.value
  if (!n || !m || !dateV.value) return
  const due = toDue(dateV.value, timeV.value)
  if (!due) return
  await ws.setReminder(m.id, m.projectId, n.uid, n.text, due.due, due.hasTime)
}
async function clear() {
  const n = node.value
  const m = map.value
  if (!n || !m) return
  await ws.clearReminder(m.id, n.uid)
  dateV.value = ''
  timeV.value = ''
}
</script>

<style scoped>
.reminder {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}
.r-row { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }
.r-ico { color: var(--clay); }
.r-title { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.r-chip {
  margin-left: auto; display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 4px 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 500;
  background: var(--surface-2); color: var(--text);
}
.r-chip.overdue { background: color-mix(in srgb, var(--danger) 16%, transparent); color: var(--danger); }
.r-chip.today { background: var(--accent-soft); color: var(--accent); }
.r-clear { display: inline-grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; color: inherit; opacity: 0.7; }
.r-clear:hover { opacity: 1; background: rgba(0, 0, 0, 0.08); }
.r-edit { display: flex; gap: 6px; }
.r-date { flex: 1; height: 32px; }
.r-time { width: 96px; height: 32px; }
.r-time:disabled { opacity: 0.5; }
.r-set { height: 32px; }
</style>
