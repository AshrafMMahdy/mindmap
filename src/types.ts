// Core domain types for the workspace. Kept framework- and engine-agnostic so
// the storage layer and the MapEngine adapter can both depend on them without
// coupling to simple-mind-map internals.

/** A project / category that groups maps and holds its own notes. */
export interface Project {
  id: string
  name: string
  color?: string
  order: number
  /** Rich-text (HTML) notes for this category, edited in the right sidebar. */
  notes: string
  createdAt: number
  updatedAt: number
}

/** Per-node data. Mirrors the fields we set on simple-mind-map nodes, plus our
 *  own flags. Extra keys from the engine are allowed to pass through. */
export interface MindMapNodeData {
  text: string
  done?: boolean
  hyperlink?: string
  hyperlinkTitle?: string
  note?: string
  /** Embedded image as a data URL (from paste). */
  image?: string
  imageTitle?: string
  imageSize?: { width: number; height: number; custom?: boolean }
  [key: string]: unknown
}

/** A node in the map tree (simple-mind-map's data shape: { data, children }). */
export interface MindMapNode {
  data: MindMapNodeData
  children: MindMapNode[]
}

/** A single mind map document. */
export interface MapDoc {
  id: string
  projectId: string
  name: string
  /** Root node of the tree (engine data shape). */
  tree: MindMapNode
  pinned: boolean
  archived: boolean
  theme?: string
  layout?: string
  order: number
  createdAt: number
  updatedAt: number
}

/** The full exportable workspace (used for JSON export/import). */
export interface Workspace {
  version: number
  projects: Project[]
  maps: MapDoc[]
  exportedAt?: number
}

export const WORKSPACE_VERSION = 1
