import { shallowRef } from 'vue'
import { createEngine } from './SimpleMindMapEngine'
import type { ActiveNode, MapEngine } from './MapEngine'

// One engine instance backs the single canvas. Kept module-level (not in Pinia)
// so the live node handles are never deep-reactified by Vue.
const engine: MapEngine = createEngine()
const activeNodes = shallowRef<ActiveNode[]>([])

export function useEngine(): { engine: MapEngine; activeNodes: typeof activeNodes } {
  return { engine, activeNodes }
}
