<template>
  <div class="rich" :class="{ compact }">
    <div class="rich-toolbar">
      <button class="rb" title="Heading" @mousedown.prevent="toggleHeading"><span class="g">H</span></button>
      <button class="rb" title="Bold (Ctrl+B)" @mousedown.prevent="exec('bold')"><b>B</b></button>
      <button class="rb" title="Italic (Ctrl+I)" @mousedown.prevent="exec('italic')"><i>I</i></button>
      <button class="rb" title="Strikethrough" @mousedown.prevent="exec('strikeThrough')"><s>S</s></button>
      <span class="rb-sep" />
      <button class="rb" title="Bulleted list" @mousedown.prevent="exec('insertUnorderedList')"><span class="g">•</span></button>
      <button class="rb" title="Numbered list" @mousedown.prevent="exec('insertOrderedList')"><span class="g mono">1.</span></button>
      <button class="rb" title="Checkbox" @mousedown.prevent="insertCheckbox"><span class="g">☐</span></button>
      <span class="rb-sep" />
      <button class="rb" title="Add link" @mousedown.prevent="addLink"><AppIcon name="link" :size="15" /></button>
      <button class="rb" title="Insert image" @mousedown.prevent="pickImage"><AppIcon name="image" :size="15" /></button>
    </div>
    <div
      ref="el"
      class="rich-body scroll"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="onInput"
      @keydown="onKeydown"
      @paste="onPaste"
      @mousedown="onMouseDown"
    />
    <input ref="fileEl" type="file" accept="image/*" hidden @change="onImageFile" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { promptText } from '../lib/confirm'
import { fileToDataUrl } from '../lib/image'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{ modelValue: string; placeholder?: string; compact?: boolean }>(),
  { placeholder: 'Write…', compact: false },
)
const emit = defineEmits<{ 'update:modelValue': [string] }>()

const el = ref<HTMLElement | null>(null)
const fileEl = ref<HTMLInputElement | null>(null)

function emitChange() {
  if (el.value) emit('update:modelValue', el.value.innerHTML)
}
function onInput() {
  emitChange()
}

// Sync external value in only when it differs and we are not editing, to avoid
// fighting the caret.
watch(
  () => props.modelValue,
  (v) => {
    if (el.value && document.activeElement !== el.value && el.value.innerHTML !== (v || '')) {
      el.value.innerHTML = v || ''
    }
  },
)
onMounted(() => {
  if (el.value) el.value.innerHTML = props.modelValue || ''
})

function exec(cmd: string, value?: string) {
  el.value?.focus()
  document.execCommand(cmd, false, value)
  emitChange()
}
function toggleHeading() {
  el.value?.focus()
  const cur = (document.queryCommandValue('formatBlock') || '').toLowerCase()
  document.execCommand('formatBlock', false, cur === 'h2' ? 'div' : 'h2')
  emitChange()
}
function insertCheckbox() {
  el.value?.focus()
  document.execCommand('insertHTML', false, '<span class="ck" contenteditable="false">☐</span>&nbsp;')
  emitChange()
}

async function addLink() {
  const sel = window.getSelection()
  const saved = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null
  const collapsed = saved ? saved.collapsed : true
  const url = await promptText({ title: 'Add link', placeholder: 'https://example.com', confirmLabel: 'Add' })
  if (!url) return
  el.value?.focus()
  if (saved) {
    const s = window.getSelection()
    s?.removeAllRanges()
    s?.addRange(saved)
  }
  if (collapsed) {
    document.execCommand('insertHTML', false, `<a href="${escapeAttr(url)}">${escapeHtml(url)}</a>&nbsp;`)
  } else {
    document.execCommand('createLink', false, url)
  }
  emitChange()
}

function pickImage() {
  fileEl.value?.click()
}
async function onImageFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  const url = await fileToDataUrl(file)
  el.value?.focus()
  document.execCommand('insertImage', false, url)
  emitChange()
}

function onPaste(e: ClipboardEvent) {
  const item = Array.from(e.clipboardData?.items || []).find(
    (it) => it.kind === 'file' && it.type.startsWith('image/'),
  )
  if (item) {
    const file = item.getAsFile()
    if (file) {
      e.preventDefault()
      fileToDataUrl(file).then((url) => {
        el.value?.focus()
        document.execCommand('insertImage', false, url)
        emitChange()
      })
    }
  }
  // otherwise allow normal text/html paste
}

// Toggle a checkbox on mousedown (more reliable than click for a
// contenteditable=false element, and it does not disturb the caret).
function onMouseDown(e: MouseEvent) {
  const ck = (e.target as HTMLElement)?.closest?.('.ck') as HTMLElement | null
  if (!ck) return
  e.preventDefault()
  const checked = ck.textContent?.trim() === '☑'
  ck.textContent = checked ? '☐' : '☑'
  ck.classList.toggle('done', !checked)
  emitChange()
}

function inList(): boolean {
  let n: Node | null = window.getSelection()?.anchorNode ?? null
  while (n && n !== el.value) {
    if (n.nodeName === 'LI') return true
    n = n.parentNode
  }
  return false
}

// Tab indents (Shift+Tab outdents) list items; markdown shortcuts on Space.
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Tab') {
    e.preventDefault()
    if (inList()) document.execCommand(e.shiftKey ? 'outdent' : 'indent')
    else document.execCommand('insertText', false, '\t')
    emitChange()
    return
  }
  if (e.key !== ' ') return
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return
  const range = sel.getRangeAt(0)
  const node = range.startContainer
  if (node.nodeType !== Node.TEXT_NODE) return
  const before = (node.textContent || '').slice(0, range.startOffset)
  const marker = before.trim()
  const map: Record<string, () => void> = {
    '#': () => document.execCommand('formatBlock', false, 'h2'),
    '##': () => document.execCommand('formatBlock', false, 'h3'),
    '###': () => document.execCommand('formatBlock', false, 'h3'),
    '-': () => document.execCommand('insertUnorderedList'),
    '*': () => document.execCommand('insertUnorderedList'),
    '>': () => document.execCommand('formatBlock', false, 'blockquote'),
    '[]': () => insertCheckbox(),
    '[ ]': () => insertCheckbox(),
  }
  const action = map[marker] || (/^\d+\.$/.test(marker) ? () => document.execCommand('insertOrderedList') : null)
  if (!action || before.length !== range.startOffset) return
  // only fire if the marker is the whole text before the caret in this node
  if (before !== marker) return
  e.preventDefault()
  ;(node as Text).textContent = (node.textContent || '').slice(range.startOffset)
  const r = document.createRange()
  r.setStart(node, 0)
  r.collapse(true)
  sel.removeAllRanges()
  sel.addRange(r)
  action()
  emitChange()
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
}
function escapeAttr(s: string) {
  return s.replace(/"/g, '&quot;')
}
</script>

<style scoped>
.rich { display: flex; flex-direction: column; min-height: 0; }
.rich-toolbar {
  display: flex; align-items: center; gap: 1px; flex-wrap: wrap;
  padding: 4px; margin-bottom: 6px;
  background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm);
}
.rb {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 28px; height: 28px; padding: 0 6px; border-radius: 6px;
  color: var(--text-muted); font-size: 13px;
  transition: background 0.12s, color 0.12s;
}
.rb:hover { background: var(--elev); color: var(--text); }
.rb .g { font-weight: 600; }
.rb .g.mono { font-family: var(--font-mono); font-size: 11px; }
.rb-sep { width: 1px; height: 18px; background: var(--border); margin: 0 3px; }

.rich-body {
  flex: 1; min-height: v-bind('compact ? "96px" : "260px"');
  padding: 11px 13px; outline: none; line-height: 1.6; font-size: 13.5px;
  border: 1px solid var(--border); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--text);
  overflow-wrap: anywhere; overflow-y: auto;
}
.rich-body:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.rich-body:empty::before { content: attr(data-placeholder); color: var(--text-faint); }
.rich-body :deep(h2) { font-family: var(--font-display); font-size: 18px; margin: 6px 0 4px; }
.rich-body :deep(h3) { font-size: 15px; font-weight: 600; margin: 6px 0 3px; }
.rich-body :deep(ul) { padding-left: 22px; margin: 4px 0; }
.rich-body :deep(ul ul) { list-style-type: circle; }
.rich-body :deep(ul ul ul) { list-style-type: square; }
.rich-body :deep(ol) { counter-reset: li; list-style: none; padding-left: 22px; margin: 4px 0; }
.rich-body :deep(ol > li) { counter-increment: li; }
.rich-body :deep(ol > li)::before { content: counters(li, '.') '. '; color: var(--text-muted); }
.rich-body :deep(blockquote) { margin: 6px 0; padding: 2px 0 2px 12px; border-left: 3px solid var(--border-strong); color: var(--text-muted); }
.rich-body :deep(a) { color: var(--accent); }
.rich-body :deep(img) { max-width: 100%; border-radius: 8px; margin: 4px 0; }
.rich-body :deep(.ck) { cursor: pointer; user-select: none; color: var(--text-muted); }
.rich-body :deep(.ck.done) { color: var(--done); }
</style>
