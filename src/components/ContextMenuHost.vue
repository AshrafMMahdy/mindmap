<template>
  <Teleport to="body">
    <Transition name="menu">
      <div
        v-if="menuState.open"
        ref="menuEl"
        class="menu"
        :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
        @contextmenu.prevent
      >
        <template v-for="(item, i) in menuState.items" :key="i">
          <div v-if="item.separatorBefore" class="menu-sep" />
          <button
            class="menu-item"
            :class="{ danger: item.danger, disabled: item.disabled }"
            :disabled="item.disabled"
            @click="run(item)"
          >
            <AppIcon v-if="item.icon" :name="item.icon" :size="15" />
            <span>{{ item.label }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import { closeMenu, menuState, type MenuItem } from '../lib/menu'
import AppIcon from './AppIcon.vue'

const menuEl = ref<HTMLElement | null>(null)
const pos = reactive({ x: 0, y: 0 })

function run(item: MenuItem) {
  if (item.disabled) return
  closeMenu()
  item.onClick()
}

function onPointerDown(e: PointerEvent) {
  if (menuEl.value && !menuEl.value.contains(e.target as Node)) closeMenu()
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') closeMenu()
}

watch(
  () => menuState.open,
  async (open) => {
    if (open) {
      pos.x = menuState.x
      pos.y = menuState.y
      await nextTick()
      const el = menuEl.value
      if (el) {
        const r = el.getBoundingClientRect()
        const pad = 8
        if (menuState.x + r.width + pad > window.innerWidth) pos.x = window.innerWidth - r.width - pad
        if (menuState.y + r.height + pad > window.innerHeight) pos.y = window.innerHeight - r.height - pad
      }
      window.addEventListener('pointerdown', onPointerDown, true)
      window.addEventListener('keydown', onKey, true)
      window.addEventListener('resize', closeMenu)
      window.addEventListener('wheel', closeMenu, { passive: true })
    } else {
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('wheel', closeMenu)
    }
  },
)
</script>

<style scoped>
.menu {
  position: fixed;
  z-index: 1000;
  min-width: 184px;
  padding: 6px;
  background: var(--elev);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-pop);
}
.menu-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 8px 10px;
  border-radius: var(--radius-sm);
  color: var(--text); font-size: 13px; text-align: left;
  transition: background 0.12s, color 0.12s;
}
.menu-item:hover { background: var(--surface-2); }
.menu-item .icon { color: var(--text-muted); }
.menu-item:hover .icon { color: var(--text); }
.menu-item.danger { color: var(--danger); }
.menu-item.danger:hover { background: color-mix(in srgb, var(--danger) 12%, transparent); }
.menu-item.danger .icon { color: var(--danger); }
.menu-item.disabled { opacity: 0.45; cursor: default; }
.menu-item.disabled:hover { background: none; }
.menu-sep { height: 1px; margin: 5px 6px; background: var(--border); }

.menu-enter-active { transition: opacity 0.12s ease, transform 0.12s cubic-bezier(0.22, 1, 0.36, 1); }
.menu-leave-active { transition: opacity 0.1s ease; }
.menu-enter-from { opacity: 0; transform: scale(0.96) translateY(-4px); }
.menu-leave-to { opacity: 0; }
</style>
