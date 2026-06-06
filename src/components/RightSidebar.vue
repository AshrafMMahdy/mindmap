<template>
  <div class="right">
    <!-- NODE DETAILS -->
    <template v-if="ws.rightMode === 'node'">
      <header class="r-head">
        <span class="section-label">{{ count > 1 ? `${count} nodes selected` : 'Node' }}</span>
        <button class="icon-btn" title="Clear selection" @click="closePanel"><AppIcon name="x" :size="16" /></button>
      </header>

      <div v-if="one" class="scroll r-body">
        <label class="r-label">Text</label>
        <input v-model="text" class="field" @keydown.enter.prevent="commitText" @blur="commitText" />

        <button class="done-toggle" :class="{ on: done }" @click="toggleDone">
          <span class="check"><AppIcon v-if="done" name="check" :size="13" :stroke="2.6" /></span>
          {{ done ? 'Marked done' : 'Mark done' }}
        </button>

        <label class="r-label">Link</label>
        <div class="row">
          <input v-model="link" class="field" placeholder="https://, mailto:, C:\path…" @keydown.enter.prevent="commitLink" @blur="commitLink" />
          <button class="icon-btn" title="Open link" :disabled="!link" @click="openLink"><AppIcon name="link" :size="16" /></button>
        </div>

        <label class="r-label">Note</label>
        <textarea v-model="note" class="field area" rows="5" placeholder="Longer note for this node…" @input="saveNote" @blur="flushNote" />

        <label class="r-label">Image</label>
        <button class="btn block" @click="pickImage"><AppIcon name="image" :size="16" /> Add / replace image</button>
        <button v-if="hasImage" class="btn block subtle" @click="removeImage"><AppIcon name="x" :size="15" /> Remove image</button>

        <p class="hint"><AppIcon name="sparkle" :size="13" /> Paste an image or link straight onto a node on the canvas.</p>
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
      <div class="notes-toolbar">
        <button class="icon-btn sm" title="Bold" @mousedown.prevent="format('bold')"><b>B</b></button>
        <button class="icon-btn sm" title="Italic" @mousedown.prevent="format('italic')"><i>I</i></button>
        <button class="icon-btn sm" title="Bulleted list" @mousedown.prevent="format('insertUnorderedList')"><AppIcon name="layout" :size="15" /></button>
        <button class="icon-btn sm" title="Checklist line" @mousedown.prevent="insertCheck"><AppIcon name="check" :size="15" /></button>
      </div>
      <div
        ref="editor"
        class="scroll notes"
        contenteditable="true"
        data-placeholder="Notes for this project — meeting points, links, to-dos…"
        @input="onNotesInput"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useWorkspace } from '../store/workspace'
import { useEngine } from '../engine/useEngine'
import { debounce } from '../lib/debounce'
import { fileToDataUrl, fitImage, imageSize } from '../lib/image'
import AppIcon from './AppIcon.vue'

const ws = useWorkspace()
const { activeNodes } = useEngine()

const count = computed(() => activeNodes.value.length)
const one = computed(() => (activeNodes.value.length === 1 ? activeNodes.value[0] : null))

// local mirrors of the active node's fields
const text = ref('')
const link = ref('')
const note = ref('')
const done = ref(false)
const hasImage = ref(false)

watch(
  one,
  (n) => {
    if (!n) return
    text.value = n.text
    link.value = n.hyperlink
    note.value = n.note
    done.value = n.done
    hasImage.value = !!n.data.image
  },
  { immediate: true },
)

function commitText() {
  const n = one.value
  if (n && text.value !== n.text) n.setText(text.value)
}
function commitLink() {
  const n = one.value
  if (n && link.value !== n.hyperlink) n.setHyperlink(link.value)
}
function openLink() {
  if (link.value) window.open(link.value, '_blank')
}
const saveNote = debounce(() => one.value?.setNote(note.value), 500)
function flushNote() {
  saveNote.flush()
  one.value?.setNote(note.value)
}
function toggleDone() {
  const n = one.value
  if (!n) return
  done.value = !done.value
  n.setDone(done.value)
}
function setAllDone(v: boolean) {
  activeNodes.value.forEach((n) => n.setDone(v))
}

// images
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

function closePanel() {
  ws.selectedProjectId = null
  ws.rightMode = 'empty'
}

// ---- project notes (contenteditable) ----
const editor = ref<HTMLElement | null>(null)
const saveNotes = debounce(() => {
  const id = ws.selectedProjectId
  if (id && editor.value) ws.setProjectNotes(id, editor.value.innerHTML)
}, 500)
function onNotesInput() {
  saveNotes()
}
function format(cmd: string) {
  editor.value?.focus()
  document.execCommand(cmd, false)
  saveNotes()
}
function insertCheck() {
  editor.value?.focus()
  document.execCommand('insertHTML', false, '☐ ')
  saveNotes()
}
watch(
  () => [ws.rightMode, ws.selectedProjectId],
  () => {
    if (ws.rightMode !== 'project') return
    nextTick(() => {
      if (editor.value) editor.value.innerHTML = ws.selectedProject?.notes || ''
    })
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
.r-label:first-child { margin-top: 0; }
.row { display: flex; gap: 6px; }
.area { height: auto; padding: 10px 12px; resize: vertical; line-height: 1.5; }

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

.btn.block { width: 100%; justify-content: center; margin-top: 8px; }
.btn.subtle { background: transparent; box-shadow: none; color: var(--text-muted); }
.hint { display: flex; gap: 7px; align-items: flex-start; margin-top: 18px; padding: 10px 12px; border-radius: var(--radius-sm); background: var(--surface-2); color: var(--text-muted); font-size: 12px; line-height: 1.5; }
.hint .icon { color: var(--clay); margin-top: 1px; flex: none; }
.multi { color: var(--text-muted); margin: 0 0 12px; }

.notes-toolbar { display: flex; gap: 2px; padding: 8px 12px; border-bottom: 1px solid var(--border); }
.icon-btn.sm { width: 30px; height: 30px; font-family: var(--font-display); }
.notes {
  flex: 1; padding: 16px; outline: none; line-height: 1.6; font-size: 13.5px;
  overflow-wrap: anywhere;
}
.notes:empty::before { content: attr(data-placeholder); color: var(--text-faint); }
.notes :deep(ul) { padding-left: 20px; }
.notes :deep(a) { color: var(--accent); }
</style>
