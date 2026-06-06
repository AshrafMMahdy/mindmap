import Dexie, { type Table } from 'dexie'
import type { MapDoc, Project } from '../types'

// IndexedDB is the source of truth. It works over http://localhost (the
// launcher), inside Electron, and on a hosted origin. The whole workspace is
// also exportable/importable as JSON for backup and portability.
class MindMapDB extends Dexie {
  projects!: Table<Project, string>
  maps!: Table<MapDoc, string>

  constructor() {
    super('mindmap')
    this.version(1).stores({
      projects: 'id, order, updatedAt',
      maps: 'id, projectId, order, updatedAt',
    })
  }
}

export const db = new MindMapDB()
