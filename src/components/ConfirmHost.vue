<template>
  <Teleport to="body">
    <Transition name="dlg">
      <div v-if="confirmState.open" class="overlay" @click.self="cancel">
        <div class="dialog" role="dialog" aria-modal="true">
          <h3 class="title">{{ confirmState.title }}</h3>
          <p v-if="confirmState.message" class="msg">{{ confirmState.message }}</p>
          <input
            v-if="confirmState.mode === 'prompt'"
            ref="inputEl"
            v-model="confirmState.inputValue"
            class="field prompt-input"
            :placeholder="confirmState.placeholder"
            @keydown.enter.prevent="ok"
          />
          <div class="actions">
            <button class="btn btn-ghost" @click="cancel">{{ confirmState.cancelLabel }}</button>
            <button
              ref="confirmBtn"
              class="btn"
              :class="confirmState.danger ? 'btn-danger' : 'btn-accent'"
              @click="ok"
            >
              {{ confirmState.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { confirmState, resolveConfirm } from '../lib/confirm'

const confirmBtn = ref<HTMLButtonElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const ok = () => resolveConfirm(true)
const cancel = () => resolveConfirm(false)

function onKey(e: KeyboardEvent) {
  if (!confirmState.open) return
  if (e.key === 'Escape') cancel()
  else if (e.key === 'Enter' && confirmState.mode === 'confirm') ok()
}

watch(
  () => confirmState.open,
  async (open) => {
    if (open) {
      window.addEventListener('keydown', onKey, true)
      await nextTick()
      if (confirmState.mode === 'prompt') {
        inputEl.value?.focus()
        inputEl.value?.select()
      } else {
        confirmBtn.value?.focus()
      }
    } else {
      window.removeEventListener('keydown', onKey, true)
    }
  },
)
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 1100;
  display: grid; place-items: center; padding: 24px;
  background: rgba(20, 16, 10, 0.42);
  backdrop-filter: blur(2px);
}
:root[data-theme="dark"] .overlay { background: rgba(0, 0, 0, 0.55); }
.dialog {
  width: min(440px, 100%);
  padding: 22px 22px 18px;
  background: var(--elev);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
.title { font-size: 19px; }
.msg { margin: 8px 0 0; color: var(--text-muted); font-size: 13.5px; line-height: 1.55; }
.prompt-input { margin-top: 14px; }
.actions { display: flex; justify-content: flex-end; gap: 9px; margin-top: 18px; }
.btn-danger { background: var(--danger); color: #fff; border-color: transparent; }
.btn-danger:hover { filter: brightness(1.06); }

.dlg-enter-active { transition: opacity 0.16s ease; }
.dlg-enter-active .dialog { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s; }
.dlg-leave-active { transition: opacity 0.12s ease; }
.dlg-enter-from { opacity: 0; }
.dlg-enter-from .dialog { transform: translateY(10px) scale(0.97); opacity: 0; }
.dlg-leave-to { opacity: 0; }
</style>
