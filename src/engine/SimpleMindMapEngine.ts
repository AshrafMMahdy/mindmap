import MindMap from 'simple-mind-map'
import Export from 'simple-mind-map/src/plugins/Export.js'
import ExportPDF from 'simple-mind-map/src/plugins/ExportPDF.js'
import Drag from 'simple-mind-map/src/plugins/Drag.js'
import Select from 'simple-mind-map/src/plugins/Select.js'
import KeyboardNavigation from 'simple-mind-map/src/plugins/KeyboardNavigation.js'
import { CUSTOM_THEMES, DEFAULT_LAYOUT, DEFAULT_THEME } from './themes'
import type {
  ActiveNode,
  ExportFormat,
  ImageInput,
  LayoutName,
  MapEngine,
  MountOpts,
  ThemeName,
} from './MapEngine'
import type { MindMapNode } from '../types'

const DONE_TAG = 'Done'

let pluginsRegistered = false
function registerPlugins() {
  if (pluginsRegistered) return
  MindMap.usePlugin(Export)
    .usePlugin(ExportPDF)
    .usePlugin(Drag)
    .usePlugin(Select)
    .usePlugin(KeyboardNavigation)
  for (const [name, config] of Object.entries(CUSTOM_THEMES)) {
    try {
      MindMap.defineTheme(name, config)
    } catch {
      /* already defined */
    }
  }
  pluginsRegistered = true
}

export function defaultRoot(text = 'Central Idea'): MindMapNode {
  return { data: { text }, children: [] }
}

/** Wrap a raw simple-mind-map node instance in our stable ActiveNode handle. */
function wrapNode(raw: any): ActiveNode {
  const d = (): any => raw?.nodeData?.data ?? {}
  return {
    get uid() {
      return raw?.uid ?? d().uid ?? ''
    },
    get text() {
      return d().text ?? ''
    },
    get data() {
      return { ...d() }
    },
    get done() {
      return !!d().done
    },
    get hyperlink() {
      return d().hyperlink ?? ''
    },
    get note() {
      return d().note ?? ''
    },
    setText: (t: string) => raw.setText(t),
    setHyperlink: (link: string, title?: string) => raw.setHyperlink(link, title ?? ''),
    setNote: (note: string) => raw.setNote(note),
    setImage: (img: ImageInput | null) => raw.setImage(img),
    setAttachment: (url: string, name?: string) => raw.setAttachment(url, name ?? ''),
    setDone: (done: boolean) => {
      const tags: any[] = (d().tag || []).filter((t: any) =>
        typeof t === 'string' ? t !== DONE_TAG : t?.text !== DONE_TAG,
      )
      if (done) tags.push({ text: DONE_TAG, style: { fill: '#16a34a', color: '#ffffff' } })
      raw.setTag(tags)
      raw.setData({ done })
    },
  }
}

export class SimpleMindMapEngine implements MapEngine {
  private mm: any = null
  private changeCb: ((tree: MindMapNode) => void) | null = null
  private activeCb: ((nodes: ActiveNode[]) => void) | null = null

  mount(el: HTMLElement, opts: MountOpts = {}) {
    registerPlugins()
    this.mm = new MindMap({
      el,
      data: opts.data ?? defaultRoot(),
      theme: opts.theme ?? DEFAULT_THEME,
      layout: opts.layout ?? DEFAULT_LAYOUT,
      readonly: opts.readonly ?? false,
      mousewheelAction: 'zoom',
      mousewheelZoomActionReverse: true,
      enableFreeDrag: false,
      defaultInsertSecondLevelNodeText: 'New idea',
      defaultInsertBelowSecondLevelNodeText: 'Sub-idea',
      defaultGeneralizationText: 'Summary',
      // the lib's generated .d.ts marks every option as required; we pass a
      // valid subset, so widen to any for the constructor call.
    } as any)
    this.mm.on('data_change', (data: MindMapNode) => this.changeCb?.(data))
    this.mm.on('node_active', (_node: any, list: any[]) =>
      this.activeCb?.((list || []).map(wrapNode)),
    )
  }

  destroy() {
    try {
      this.mm?.destroy()
    } finally {
      this.mm = null
    }
  }

  resize() {
    this.mm?.resize()
  }

  load(data: MindMapNode, theme?: ThemeName, layout?: LayoutName) {
    if (!this.mm) return
    if (theme) this.mm.setTheme(theme, true)
    if (layout) this.mm.setLayout(layout, true)
    // fit once the new tree has actually rendered (render is async/throttled)
    const fitOnce = () => {
      this.mm?.off('node_tree_render_end', fitOnce)
      this.fit()
    }
    this.mm.on('node_tree_render_end', fitOnce)
    this.mm.setData(data)
    // fallback in case the event name differs across versions
    setTimeout(() => this.fit(), 280)
  }

  getData(): MindMapNode {
    return this.mm?.getData() as MindMapNode
  }

  setData(data: MindMapNode) {
    this.mm?.setData(data)
  }

  onChange(cb: (tree: MindMapNode) => void) {
    this.changeCb = cb
  }

  onActiveNodesChange(cb: (nodes: ActiveNode[]) => void) {
    this.activeCb = cb
  }

  getActiveNodes(): ActiveNode[] {
    const list: any[] = this.mm?.renderer?.activeNodeList ?? []
    return list.map(wrapNode)
  }

  addChild() {
    this.mm?.execCommand('INSERT_CHILD_NODE')
  }
  addSibling() {
    this.mm?.execCommand('INSERT_NODE')
  }
  removeActive() {
    this.mm?.execCommand('REMOVE_NODE')
  }
  undo() {
    this.mm?.execCommand('BACK')
  }
  redo() {
    this.mm?.execCommand('FORWARD')
  }

  setTheme(theme: ThemeName) {
    this.mm?.setTheme(theme)
  }
  getTheme(): ThemeName {
    return this.mm?.getTheme()
  }
  setLayout(layout: LayoutName) {
    this.mm?.setLayout(layout)
  }
  getLayout(): LayoutName {
    return this.mm?.getLayout()
  }

  private center(): [number, number] {
    const w = this.mm?.width || this.mm?.el?.clientWidth || 0
    const h = this.mm?.height || this.mm?.el?.clientHeight || 0
    return [w / 2, h / 2]
  }
  zoomIn() {
    const [x, y] = this.center()
    this.mm?.view.enlarge(x, y)
  }
  zoomOut() {
    const [x, y] = this.center()
    this.mm?.view.narrow(x, y)
  }
  fit() {
    // svg.js rbox() can throw mid-render ("Getting rbox of element is not
    // possible"); fitting is best-effort, so swallow it.
    try {
      this.mm?.view?.fit()
    } catch {
      /* ignore */
    }
  }

  insertImageToActive(img: ImageInput) {
    this.getActiveNodes().forEach((n) => n.setImage(img))
  }
  insertLinkToActive(url: string, title?: string) {
    this.getActiveNodes().forEach((n) => n.setHyperlink(url, title))
  }

  async exportMap(type: ExportFormat, fileName: string) {
    await this.mm?.export(type, true, fileName)
  }
  async toPng(): Promise<string> {
    return await this.mm?.export('png', false, 'preview')
  }
}

export function createEngine(): MapEngine {
  return new SimpleMindMapEngine()
}
