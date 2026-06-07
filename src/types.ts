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
  /** Free-form rich note (HTML), edited in the right panel. Not used by the
   *  engine's own rendering; persisted in the tree so it exports with the map. */
  richNote?: string
  /** Which note editor the right panel shows for this node. */
  noteMode?: 'fields' | 'freeform'
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
/** A one-per-node reminder. Stored in its own table so the left sidebar can
 *  list them chronologically across all projects and maps. */
export interface Reminder {
  id: string
  mapId: string
  projectId: string
  nodeUid: string
  nodeText: string
  /** Epoch milliseconds for the due moment. */
  due: number
  /** False = date only (no specific time). */
  hasTime: boolean
  createdAt: number
  updatedAt: number
}

export interface Workspace {
  version: number
  projects: Project[]
  maps: MapDoc[]
  reminders?: Reminder[]
  exportedAt?: number
}

export const WORKSPACE_VERSION = 1
