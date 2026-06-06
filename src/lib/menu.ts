import { reactive } from 'vue'

export interface MenuItem {
  label: string
  icon?: string
  danger?: boolean
  disabled?: boolean
  separatorBefore?: boolean
  onClick: () => void
}

export const menuState = reactive({
  open: false,
  x: 0,
  y: 0,
  items: [] as MenuItem[],
})

/** Open a context menu at the mouse position with the given items. */
export function openMenu(e: MouseEvent, items: MenuItem[]) {
  e.preventDefault()
  e.stopPropagation()
  menuState.x = e.clientX
  menuState.y = e.clientY
  menuState.items = items
  menuState.open = true
}

export function closeMenu() {
  menuState.open = false
  menuState.items = []
}
