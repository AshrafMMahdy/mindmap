<template>
  <div class="right">
    <!-- NODE DETAILS -->
    <template v-if="ws.rightMode === 'node'">
      <header class="r-head">
        <span class="section-label">{{ count > 1 ? `${count} nodes selected` : 'Node' }}</span>
        <button class="icon-btn" title="Clear selection" @click="closePanel"><AppIcon name="x" :size="16" /></button>
      </header>

      <div v-if="one" class="scroll r-body">
        <ReminderBar />

        <label class="r-label">Text</label>
        <input v-model="text" class="field" @keydown.enter.prevent="commitText" @blur="commitText" />

        <button class="done-toggle" :class="{ on: done }" @click="toggleDone">
          <span class="check"><AppIcon v-if="done" name="check" :size="13" :stroke="2.6" /></span>
          {{ done ? 'Marked done' : 'Mark done' }}
        </button>

        <div class="mode-row">
          <span class="r-label flat">Note</span>
          <div class="seg">
            <button :class="{ active: mode === 'fields' }" @click="setMode('fields')">Fields</button>
            <button :class="{ active: mode === 'freeform' }" @click="setMode('freeform')">Free-form</button>
          </div>
          <button class="btn-mini" title="Export this note" @click="openExportMenu">
            <AppIcon name="download" :size="14" /> Export
          </button>
        </div>

        <template v-if="mode === 'fields'">
          <label class="r-label">Link</label>
          <div class="row">
            <input v-model="link" class="field" placeholder="https://, mailto:, C:\path…" @keydown.enter.prevent="commitLink" @blur="commitLink" />
            <button class="icon-btn" title="Open link" :disabled="!link" @click="openLink"><AppIcon name="link" :size="16" /></button>
          </div>
          <div class="img-row">
            <button class="btn block" @click="pickImage"><AppIcon name="image" :size="16" /> Add / replace image</button>
            <button v-if="hasImage" class="btn block subtle" @click="removeImage"><AppIcon name="x" :size="15" /> Remove image</button>
          </div>
        </template>

        <RichEditor
          v-model="richNote"
          :compact="mode === 'fields'"
          placeholder="Write a note…  ( -  •   # heading   [] checkbox )"
          class="note-editor"
        />

        <input ref="imgInput" type="file" accept="image/*" hidden @change="onImage" />
      </div>

      <div v-else class="scroll r-body">
        <p class="multi">{{ count }} nodes selected.</p>
        <button class="btn block" @click="setAllDone(true)"><AppIcon name="checkCircle" :size="16" /> Mark all done</button>
        <button class="btn block subtle" @click="setAllDone(false)"><AppIcon name="circle" :size="16" /> Clear done</button>
      </div>
    </template>

    <!-- CATEGORY NOTES -->
    <template v-else-if="ws.rightMode === 'project'">
      <header class="r-head">
        <span class="dot" :style="{ background: ws.selectedProject?.color }" />
        <span class="proj-title">{{ ws.selectedProject?.name }}</span>
        <button class="icon-btn" title="Close" @click="closePanel"><AppIcon name="x" :size="16" /></button>
      </header>
      <div class="scroll r-body">
        <RichEditor v-model="projectNotes" placeholder="Notes for this project — meeting points, links, to-dos…" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useWorkspace } from '../store/workspace'
import { useEngine } from '../engine/useEngine'
import { debounce } from '../lib/debounce'
import { fileToDataUrl, fitImage, imageSize } from '../lib/image'
import { exportNote, type NoteFormat } from '../export/noteExport'
import { openMenu } from '../lib/menu'
import AppIcon from './AppIcon.vue'
import RichEditor from './RichEditor.vue'
import ReminderBar from './ReminderBar.vue'

const ws = useWorkspace()
const { activeNodes } = useEngine()

const count = computed(() => activeNodes.value.length)
const one = computed(() => (activeNodes.value.length === 1 ? activeNodes.value[0] : null))

// local mirrors of the active node
const text = ref('')
const link = ref('')
const done = ref(false)
const hasImage = ref(false)
const richNote = ref('')
const mode = ref<'fields' | 'freeform'>('fields')

watch(
  one,
  (n) => {
    if (!n) return
    text.value = n.text
    link.value = n.hyperlink
    done.value = n.done
    hasImage.value = !!n.data.image
    richNote.value = n.richNote
    mode.value = n.noteMode
  },
  { immediate: true },
)

const saveRich = debounce(() => {
  if (one.value && richNote.value !== one.value.richNote) one.value.setRichNote(richNote.value)
}, 500)
watch(richNote, () => saveRich())

function setMode(m: 'fields' | 'freeform') {
  mode.value = m
  one.value?.setNoteMode(m)
}

function commitText() {
  if (one.value && text.value !== one.value.text) one.value.setText(text.value)
}
function commitLink() {
  if (one.value && link.value !== one.value.hyperlink) one.value.setHyperlink(link.value)
}
function openLink() {
  if (link.value) window.open(link.value, '_blank')
}
function toggleDone() {
  if (!one.value) return
  done.value = !done.value
  one.value.setDone(done.value)
}
function setAllDone(v: boolean) {
  activeNodes.value.forEach((n) => n.setDone(v))
}

// images (fields mode)
const imgInput = ref<HTMLInputElement | null>(null)
function pickImage() {
  imgInput.value?.click()
}
async function onImage(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file || !one.value) return
  const url = await fileToDataUrl(file)
  const { width, height } = await imageSize(url)
  const fit = fitImage(width, height)
  one.value.setImage({ url, width: fit.width, height: fit.height, title: file.name })
  hasImage.value = true
}
function removeImage() {
  one.value?.setImage(null)
  hasImage.value = false
}

function openExportMenu(e: MouseEvent) {
  const html = richNote.value || ''
  const title = one.value?.text || 'Note'
  const item = (label: string, icon: string, format: NoteFormat) => ({
    label,
    icon,
    onClick: () => exportNote(format, html, title),
  })
  openMenu(e, [
    item('Text (.txt)', 'note', 'txt'),
    item('Markdown (.md)', 'note', 'md'),
    item('PDF', 'printer', 'pdf'),
    item('Word (.doc)', 'note', 'docx'),
    item('Picture (.png)', 'image', 'png'),
  ])
}

function closePanel() {
  ws.selectedProjectId = null
  ws.rightMode = 'empty'
}

// ---- category notes ----
const projectNotes = ref('')
const saveProjectNotes = debounce(() => {
  const id = ws.selectedProjectId
  if (id) ws.setProjectNotes(id, projectNotes.value)
}, 500)
watch(projectNotes, () => {
  if (ws.rightMode === 'project') saveProjectNotes()
})
watch(
  () => [ws.rightMode, ws.selectedProjectId],
  () => {
    if (ws.rightMode === 'project') projectNotes.value = ws.selectedProject?.notes || ''
  },
  { immediate: true },
)
</script>

<style scoped>
.right { display: flex; flex-direction: column; height: 100%; width: var(--right-w); background: var(--surface); border-left: 1px solid var(--border); }
.r-head { display: flex; align-items: center; gap: 9px; height: var(--topbar-h); padding: 0 10px 0 16px; border-bottom: 1px solid var(--border); }
.r-head .section-label { flex: 1; }
.proj-title { flex: 1; font-family: var(--font-display); font-size: 17px; font-weight: 560; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dot { width: 11px; height: 11px; border-radius: 4px; flex: none; }

.r-body { flex: 1; padding: 16px; }
.r-label { display: block; margin: 14px 0 6px; font-size: 11.5px; font-weight: 600; color: var(--text-muted); }
.r-label.flat { margin: 0; }
.row { display: flex; gap: 6px; }
.img-row { margin-top: 10px; }

.done-toggle {
  display: flex; align-items: center; gap: 9px; width: 100%; margin-top: 14px;
  padding: 9px 12px; border-radius: var(--radius-sm);
  border: 1px solid var(--border); background: var(--surface); color: var(--text);
  font-weight: 500; transition: all 0.15s;
}
.done-toggle:hover { border-color: var(--border-strong); }
.done-toggle .check { display: inline-grid; place-items: center; width: 19px; height: 19px; border-radius: 6px; border: 1.5px solid var(--border-strong); color: #fff; }
.done-toggle.on { border-color: var(--done); background: color-mix(in srgb, var(--done) 12%, transparent); color: var(--done); }
.done-toggle.on .check { background: var(--done); border-color: var(--done); }

.mode-row { display: flex; align-items: center; gap: 8px; margin: 18px 0 8px; }
.seg { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.seg button { padding: 4px 10px; font-size: 12px; font-weight: 500; color: var(--text-muted); background: var(--surface); }
.seg button:hover { color: var(--text); }
.seg button.active { background: var(--accent-soft); color: var(--accent); }
.btn-mini { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 9px; border-radius: 8px; font-size: 12px; color: var(--text-muted); }
.btn-mini:hover { background: var(--surface-2); color: var(--text); }

.note-editor { margin-top: 4px; }

.btn.block { width: 100%; justify-content: center; margin-top: 8px; }
.btn.subtle { background: transparent; box-shadow: none; color: var(--text-muted); }
.multi { color: var(--text-muted); margin: 0 0 12px; }
</style>
