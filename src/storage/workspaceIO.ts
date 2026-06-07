import { db } from './db'
import { WORKSPACE_VERSION, type Workspace } from '../types'

/** Read the whole workspace out of IndexedDB. */
export async function exportWorkspace(): Promise<Workspace> {
  const [projects, maps, reminders] = await Promise.all([
    db.projects.toArray(),
    db.maps.toArray(),
    db.reminders.toArray(),
  ])
  return { version: WORKSPACE_VERSION, projects, maps, reminders, exportedAt: Date.now() }
}

/** Trigger a browser download of a blob. Works on localhost, file://, Electron. */
export function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadWorkspace(ws: Workspace, fileName = 'mindmap-workspace.json') {
  triggerDownload(new Blob([JSON.stringify(ws, null, 2)], { type: 'application/json' }), fileName)
}

export interface ImportResult {
  projects: number
  maps: number
}

/** Import a workspace JSON file. `merge` keeps existing data; `replace` wipes first. */
export async function importWorkspaceFromFile(
  file: File,
  mode: 'merge' | 'replace',
): Promise<ImportResult> {
  const text = await file.text()
  let data: Workspace
  try {
    data = JSON.parse(text) as Workspace
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!data || !Array.isArray(data.projects) || !Array.isArray(data.maps)) {
    throw new Error('That does not look like a MindMap workspace file.')
  }
  if (mode === 'replace') {
    await db.projects.clear()
    await db.maps.clear()
    await db.reminders.clear()
  }
  await db.projects.bulkPut(data.projects)
  await db.maps.bulkPut(data.maps)
  if (Array.isArray(data.reminders)) await db.reminders.bulkPut(data.reminders)
  return { projects: data.projects.length, maps: data.maps.length }
}
