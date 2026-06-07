import { reactive } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export interface PromptOptions {
  title: string
  message?: string
  placeholder?: string
  initial?: string
  confirmLabel?: string
  cancelLabel?: string
}

let resolver: ((value: unknown) => void) | null = null

export const confirmState = reactive({
  open: false,
  mode: 'confirm' as 'confirm' | 'prompt',
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  danger: false,
  placeholder: '',
  inputValue: '',
})

/** Promise-based confirm dialog. Resolves true on confirm, false otherwise. */
export function confirm(opts: ConfirmOptions): Promise<boolean> {
  Object.assign(confirmState, {
    open: true,
    mode: 'confirm',
    title: opts.title,
    message: opts.message ?? '',
    confirmLabel: opts.confirmLabel ?? 'Confirm',
    cancelLabel: opts.cancelLabel ?? 'Cancel',
    danger: !!opts.danger,
    placeholder: '',
    inputValue: '',
  })
  return new Promise<boolean>((res) => {
    resolver = res as (v: unknown) => void
  })
}

/** Promise-based single-line text prompt. Resolves the string, or null if cancelled. */
export function promptText(opts: PromptOptions): Promise<string | null> {
  Object.assign(confirmState, {
    open: true,
    mode: 'prompt',
    title: opts.title,
    message: opts.message ?? '',
    confirmLabel: opts.confirmLabel ?? 'OK',
    cancelLabel: opts.cancelLabel ?? 'Cancel',
    danger: false,
    placeholder: opts.placeholder ?? '',
    inputValue: opts.initial ?? '',
  })
  return new Promise<string | null>((res) => {
    resolver = res as (v: unknown) => void
  })
}

export function resolveConfirm(ok: boolean) {
  const r = resolver
  resolver = null
  confirmState.open = false
  if (!r) return
  if (confirmState.mode === 'prompt') r(ok ? confirmState.inputValue : null)
  else r(ok)
}
