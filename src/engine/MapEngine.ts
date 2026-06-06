import type { MindMapNode, MindMapNodeData } from '../types'

// ---------------------------------------------------------------------------
// MapEngine: the ONLY surface the app shell may touch. The concrete engine
// (currently a simple-mind-map adapter) lives behind this interface so we can
// fork it, patch it, or replace it with a hand-rolled engine later without
// changing a single component. This is the "flexibility seam".
// ---------------------------------------------------------------------------

export type ExportFormat = 'png' | 'svg' | 'pdf' | 'json' | 'smm' | 'md'

export type ThemeName = string

export type LayoutName =
  | 'logicalStructure'
  | 'logicalStructureLeft'
  | 'mindMap'
  | 'organizationStructure'
  | 'catalogOrganization'
  | 'timeline'
  | 'timeline2'
  | 'fishbone'
  | (string & {})

export interface MountOpts {
  data?: MindMapNode
  theme?: ThemeName
  layout?: LayoutName
  readonly?: boolean
}

export interface ImageInput {
  url: string
  width?: number
  height?: number
  title?: string
}

/** A thin, stable handle to a node. Returned for the active selection so the
 *  right sidebar / paste handler can mutate it without knowing the engine. */
export interface ActiveNode {
  readonly uid: string
  readonly text: string
  readonly data: MindMapNodeData
  readonly done: boolean
  readonly hyperlink: string
  readonly note: string
  setText(text: string): void
  setHyperlink(link: string, title?: string): void
  setNote(note: string): void
  setImage(img: ImageInput | null): void
  setAttachment(url: string, name?: string): void
  setDone(done: boolean): void
}

export interface MapEngine {
  /** Create the engine inside `el`. Safe to call once per instance. */
  mount(el: HTMLElement, opts?: MountOpts): void
  destroy(): void
  resize(): void

  /** Load a different map into the existing instance (no remount). */
  load(data: MindMapNode, theme?: ThemeName, layout?: LayoutName): void

  getData(): MindMapNode
  setData(data: MindMapNode): void

  onChange(cb: (tree: MindMapNode) => void): void
  onActiveNodesChange(cb: (nodes: ActiveNode[]) => void): void
  getActiveNodes(): ActiveNode[]

  // structure ops act on the current active node(s)
  addChild(): void
  addSibling(): void
  removeActive(): void
  undo(): void
  redo(): void

  setTheme(theme: ThemeName): void
  getTheme(): ThemeName
  setLayout(layout: LayoutName): void
  getLayout(): LayoutName
  zoomIn(): void
  zoomOut(): void
  fit(): void

  // rich content onto the active node (used by the paste handler)
  insertImageToActive(img: ImageInput): void
  insertLinkToActive(url: string, title?: string): void

  /** Trigger a browser download of the current map in the given format. */
  exportMap(type: ExportFormat, fileName: string): Promise<void>
  /** Render the current map to a PNG data URL (for previews, no download). */
  toPng(): Promise<string>
}
