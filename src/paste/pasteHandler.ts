import type { MapEngine } from '../engine/MapEngine'
import { fileToDataUrl, fitImage, imageSize } from '../lib/image'

const URL_RE = /^(https?:\/\/|mailto:|tel:)/i
const WWW_RE = /^www\.[^\s]+$/i
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const WINPATH_RE = /^([a-zA-Z]:\\|\\\\)[^\r\n]+$/
const FILEURL_RE = /^file:\/\//i

/** A single pasteable reference (link / email / path) vs free-form text. */
export function isSingleLink(text: string): boolean {
  if (/\s/.test(text)) return WINPATH_RE.test(text) || FILEURL_RE.test(text)
  return (
    URL_RE.test(text) ||
    WWW_RE.test(text) ||
    EMAIL_RE.test(text) ||
    WINPATH_RE.test(text) ||
    FILEURL_RE.test(text)
  )
}

export function normalizeLink(text: string): { url: string; title: string } {
  if (EMAIL_RE.test(text)) return { url: `mailto:${text}`, title: text }
  if (WWW_RE.test(text)) return { url: `https://${text}`, title: text }
  if (WINPATH_RE.test(text)) return { url: 'file:///' + text.replace(/\\/g, '/'), title: text }
  return { url: text, title: text }
}

function isEditable(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null
  if (!t) return false
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable === true
}

/**
 * Enrich the active node from the clipboard:
 *  - image  → embedded image on the node
 *  - single URL / email / Windows path → hyperlink on the node
 * Returns true if handled (caller should leave the event consumed). Free-form
 * text and pastes into form fields are left to default behaviour (the engine
 * turns multi-line text into child nodes).
 */
export async function handleCanvasPaste(e: ClipboardEvent, engine: MapEngine): Promise<boolean> {
  if (isEditable(e.target)) return false
  const dt = e.clipboardData
  if (!dt) return false
  if (engine.getActiveNodes().length === 0) return false

  const imgItem = Array.from(dt.items || []).find(
    (it) => it.kind === 'file' && it.type.startsWith('image/'),
  )
  if (imgItem) {
    const file = imgItem.getAsFile()
    if (file) {
      e.preventDefault()
      e.stopImmediatePropagation()
      const url = await fileToDataUrl(file)
      const { width, height } = await imageSize(url)
      const fit = fitImage(width, height)
      engine.insertImageToActive({ url, width: fit.width, height: fit.height, title: file.name })
      return true
    }
  }

  const text = (dt.getData('text/plain') || '').trim()
  if (text && isSingleLink(text)) {
    e.preventDefault()
    e.stopImmediatePropagation()
    const { url, title } = normalizeLink(text)
    engine.insertLinkToActive(url, title)
    return true
  }
  return false
}
