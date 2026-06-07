import Dexie, { type Table } from 'dexie'
import type { MapDoc, Project, Reminder } from '../types'

// IndexedDB is the source of truth. It works over http://localhost (the
// launcher), inside Electron, and on a hosted origin. The whole workspace is
// also exportable/importable as JSON for backup and portability.
class MindMapDB extends Dexie {
  projects!: Table<Project, string>
  maps!: Table<MapDoc, string>
  reminders!: Table<Reminder, string>

  constructor() {
    super('mindmap')
    this.version(1).stores({
      projects: 'id, order, updatedAt',
      maps: 'id, projectId, order, updatedAt',
    })
    // v2 adds reminders (one per node, listed chronologically in the sidebar)
    this.version(2).stores({
      reminders: 'id, due, mapId, projectId, nodeUid',
    })
  }
}

export const db = new MindMapDB()
