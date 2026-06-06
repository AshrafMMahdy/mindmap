import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

let resolver: ((v: boolean) => void) | null = null

export const confirmState = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
})

/** Promise-based confirm dialog. Resolves true on confirm, false otherwise. */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  confirmState.open = true
  confirmState.title = opts.title
  confirmState.message = opts.message ?? ''
  confirmState.confirmLabel = opts.confirmLabel ?? 'Confirm'
  confirmState.cancelLabel = opts.cancelLabel ?? 'Cancel'
  confirmState.danger = !!opts.danger
  return new Promise<boolean>((res) => {
    resolver = res
  })
}

export function resolveConfirm(value: boolean) {
  confirmState.open = false
  resolver?.(value)
  resolver = null
}
