import { defineStore } from 'pinia'
import { db } from '../storage/db'
import { uid } from '../lib/id'
import { plain } from '../lib/plain'
import { defaultRoot } from '../engine/SimpleMindMapEngine'
import type { MapDoc, MindMapNode, Project } from '../types'

export type RightMode = 'empty' | 'project' | 'node'

const PALETTE = [
  '#6d28d9', '#0ea5e9', '#16a34a', '#ea580c',
  '#db2777', '#ca8a04', '#0d9488', '#4f46e5',
]
function pickColor(i: number): string {
  return PALETTE[i % PALETTE.length]
}

const DEFAULT_THEME = 'paper'
const DEFAULT_LAYOUT = 'logicalStructure'

function welcomeTree(): MindMapNode {
  return {
    data: { text: 'Welcome to MindMap 👋' },
    children: [
      { data: { text: 'Double-click a node to edit' }, children: [] },
      { data: { text: 'Tab = add child   ·   Enter = add sibling' }, children: [] },
      { data: { text: 'Paste an image or link straight onto a node' }, children: [] },
      {
        data: { text: 'Mark things done', done: true, tag: [{ text: 'Done', style: { fill: '#16a34a', color: '#ffffff' } }] },
        children: [],
      },
      { data: { text: 'Export ▸ PNG / PDF to print & follow up on paper' }, children: [] },
    ],
  }
}

export const useWorkspace = defineStore('workspace', {
  state: () => ({
    projects: [] as Project[],
    maps: [] as MapDoc[],
    activeMapId: null as string | null,
    selectedProjectId: null as string | null,
    rightMode: 'empty' as RightMode,
    search: '',
    showArchived: false,
    loaded: false,
  }),

  getters: {
    orderedProjects: (s) => [...s.projects].sort((a, b) => a.order - b.order),
    activeMap: (s) => s.maps.find((m) => m.id === s.activeMapId) ?? null,
    selectedProject: (s) => s.projects.find((p) => p.id === s.selectedProjectId) ?? null,
    pinnedMaps: (s) =>
      s.maps
        .filter((m) => m.pinned && !m.archived)
        .filter((m) => matchSearch(m, s.search))
        .sort((a, b) => a.order - b.order),
    archivedMaps: (s) =>
      s.maps.filter((m) => m.archived).filter((m) => matchSearch(m, s.search)),
    mapsByProject: (s) => (projectId: string) =>
      s.maps
        .filter((m) => m.projectId === projectId && !m.archived && !m.pinned)
        .filter((m) => matchSearch(m, s.search))
        .sort((a, b) => a.order - b.order),
  },

  actions: {
    async init() {
      const [projects, maps] = await Promise.all([db.projects.toArray(), db.maps.toArray()])
      this.projects = projects
      this.maps = maps
      if (this.projects.length === 0) await this.seed()
      if (!this.activeMapId) {
        this.activeMapId = this.maps.find((m) => !m.archived)?.id ?? null
      }
      this.loaded = true
    },

    async seed() {
      const now = Date.now()
      const project: Project = {
        id: uid(), name: 'My Projects', color: pickColor(0), order: 0,
        notes: '', createdAt: now, updatedAt: now,
      }
      this.projects.push(project)
      await db.projects.put(plain(project))
      const map = this._newMap(project.id, 'Welcome', welcomeTree())
      this.maps.push(map)
      await db.maps.put(plain(map))
      this.activeMapId = map.id
    },

    _newMap(projectId: string, name: string, tree?: MindMapNode): MapDoc {
      const now = Date.now()
      return {
        id: uid(), projectId, name,
        tree: tree ?? defaultRoot(name),
        pinned: false, archived: false,
        theme: DEFAULT_THEME, layout: DEFAULT_LAYOUT,
        order: this.maps.filter((m) => m.projectId === projectId).length,
        createdAt: now, updatedAt: now,
      }
    },

    async createProject(name = 'New project'): Promise<string> {
      const now = Date.now()
      const project: Project = {
        id: uid(), name, color: pickColor(this.projects.length),
        order: this.projects.length, notes: '', createdAt: now, updatedAt: now,
      }
      this.projects.push(project)
      await db.projects.put(plain(project))
      return project.id
    },

    async renameProject(id: string, name: string) {
      const p = this.projects.find((x) => x.id === id)
      if (!p) return
      p.name = name
      p.updatedAt = Date.now()
      await db.projects.put(plain(p))
    },

    async deleteProject(id: string) {
      const removedMapIds = this.maps.filter((m) => m.projectId === id).map((m) => m.id)
      this.maps = this.maps.filter((m) => m.projectId !== id)
      this.projects = this.projects.filter((p) => p.id !== id)
      await db.maps.bulkDelete(removedMapIds)
      await db.projects.delete(id)
      if (this.selectedProjectId === id) {
        this.selectedProjectId = null
        this.rightMode = 'empty'
      }
      if (this.activeMapId && removedMapIds.includes(this.activeMapId)) {
        this.activeMapId = this.maps.find((m) => !m.archived)?.id ?? null
      }
    },

    async setProjectNotes(id: string, html: string) {
      const p = this.projects.find((x) => x.id === id)
      if (!p) return
      p.notes = html
      p.updatedAt = Date.now()
      await db.projects.put(plain(p))
    },

    selectProject(id: string) {
      this.selectedProjectId = id
      this.rightMode = 'project'
    },

    async createMap(projectId?: string, name = 'Untitled map'): Promise<MapDoc> {
      let pid = projectId ?? this.selectedProjectId ?? this.orderedProjects[0]?.id ?? null
      if (!pid) pid = await this.createProject('My Projects')
      const map = this._newMap(pid, name)
      this.maps.push(map)
      await db.maps.put(plain(map))
      this.setActiveMap(map.id)
      return map
    },

    async renameMap(id: string, name: string) {
      const m = this.maps.find((x) => x.id === id)
      if (!m) return
      m.name = name
      m.updatedAt = Date.now()
      await db.maps.put(plain(m))
    },

    async deleteMap(id: string) {
      this.maps = this.maps.filter((m) => m.id !== id)
      await db.maps.delete(id)
      if (this.activeMapId === id) {
        this.activeMapId = this.maps.find((m) => !m.archived)?.id ?? null
      }
    },

    async duplicateMap(id: string): Promise<MapDoc | null> {
      const src = this.maps.find((m) => m.id === id)
      if (!src) return null
      const copy = this._newMap(src.projectId, `${src.name} copy`, plain(src.tree))
      copy.theme = src.theme
      copy.layout = src.layout
      this.maps.push(copy)
      await db.maps.put(plain(copy))
      return copy
    },

    async togglePin(id: string) {
      const m = this.maps.find((x) => x.id === id)
      if (!m) return
      m.pinned = !m.pinned
      m.updatedAt = Date.now()
      await db.maps.put(plain(m))
    },

    async toggleArchive(id: string) {
      const m = this.maps.find((x) => x.id === id)
      if (!m) return
      m.archived = !m.archived
      if (m.archived) m.pinned = false
      m.updatedAt = Date.now()
      await db.maps.put(plain(m))
      if (m.archived && this.activeMapId === id) {
        this.activeMapId = this.maps.find((x) => !x.archived)?.id ?? null
      }
    },

    async moveMap(id: string, projectId: string) {
      const m = this.maps.find((x) => x.id === id)
      if (!m || m.projectId === projectId) return
      m.projectId = projectId
      m.order = this.maps.filter((x) => x.projectId === projectId).length
      m.updatedAt = Date.now()
      await db.maps.put(plain(m))
    },

    setActiveMap(id: string) {
      this.activeMapId = id
    },

    /** Autosave hook: persist a specific map's edited tree (id captured at
     *  edit time so a quick map-switch can't save into the wrong map). */
    async updateMapTree(id: string, tree: MindMapNode) {
      const m = this.maps.find((x) => x.id === id)
      if (!m) return
      m.tree = tree
      m.updatedAt = Date.now()
      await db.maps.put(plain(m))
    },

    /** Persist theme/layout changes for the active map. */
    async setActiveView(theme: string, layout: string) {
      const m = this.activeMap
      if (!m) return
      m.theme = theme
      m.layout = layout
      m.updatedAt = Date.now()
      await db.maps.put(plain(m))
    },

    onActiveNodesChanged(count: number) {
      if (count > 0) this.rightMode = 'node'
      else this.rightMode = this.selectedProjectId ? 'project' : 'empty'
    },

    /** Re-read everything from IndexedDB (after a workspace import). */
    async reload() {
      const [projects, maps] = await Promise.all([db.projects.toArray(), db.maps.toArray()])
      this.projects = projects
      this.maps = maps
      if (!this.maps.some((m) => m.id === this.activeMapId)) {
        this.activeMapId = this.maps.find((m) => !m.archived)?.id ?? null
      }
    },
  },
})

function matchSearch(m: MapDoc, search: string): boolean {
  const q = search.trim().toLowerCase()
  if (!q) return true
  return m.name.toLowerCase().includes(q)
}
