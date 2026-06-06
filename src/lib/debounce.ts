export interface Debounced<T extends (...args: any[]) => void> {
  (...args: Parameters<T>): void
  cancel(): void
  flush(): void
}

/** Trailing-edge debounce with cancel + flush. */
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): Debounced<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  const run = () => {
    if (lastArgs) fn(...lastArgs)
    lastArgs = null
    timer = null
  }
  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args
    if (timer) clearTimeout(timer)
    timer = setTimeout(run, ms)
  }) as Debounced<T>
  debounced.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
    lastArgs = null
  }
  debounced.flush = () => {
    if (timer) {
      clearTimeout(timer)
      run()
    }
  }
  return debounced
}
