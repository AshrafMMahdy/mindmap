import TurndownService from 'turndown'
import { toPng } from 'html-to-image'

export type NoteFormat = 'txt' | 'md' | 'pdf' | 'docx' | 'png'

function download(data: Blob | string, filename: string) {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  if (typeof data !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function htmlToText(html: string): string {
  const d = document.createElement('div')
  d.innerHTML = html || ''
  // line breaks for block elements
  d.querySelectorAll('p,div,li,h1,h2,h3,blockquote,br').forEach((e) => e.append('\n'))
  return (d.textContent || '').replace(/ /g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}
function esc(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)
}
function safeName(s: string): string {
  return (s || 'note').replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 80) || 'note'
}
function wrapDoc(html: string, title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head><body><h1>${esc(title)}</h1>${html || ''}</body></html>`
}

let _td: TurndownService | null = null
function toMarkdown(html: string): string {
  if (!_td) {
    _td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' })
    _td.addRule('strike', {
      filter: ['s', 'strike', 'del'] as unknown as TurndownService.Filter,
      replacement: (content: string) => `~~${content}~~`,
    })
  }
  return _td.turndown(html || '')
}

const LIST_CSS =
  "ol{counter-reset:li;list-style:none;padding-left:22px}ol>li{counter-increment:li}" +
  "ol>li::before{content:counters(li,'.') '. '}ul{padding-left:22px}ul ul{list-style-type:circle}ul ul ul{list-style-type:square}"

function printPdf(html: string, title: string) {
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>` +
      `<style>@page{margin:18mm}body{font-family:system-ui,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#1a1a1a;max-width:760px;margin:0 auto;padding:8px}` +
      `img{max-width:100%}h1{font-size:22px}h2{font-size:18px}h3{font-size:15px}` +
      `blockquote{border-left:3px solid #ccc;margin:8px 0;padding:2px 0 2px 12px;color:#555}a{color:#1c6b53}` +
      `.ck{margin-right:4px}${LIST_CSS}</style></head><body><h1>${esc(title)}</h1>${html || ''}` +
      `<script>setTimeout(function(){window.focus();window.print()},150)<\/script></body></html>`,
  )
  w.document.close()
}

async function pngExport(html: string, fileTitle: string, displayTitle: string) {
  const wrap = document.createElement('div')
  wrap.style.cssText =
    'position:fixed;left:-99999px;top:0;width:640px;padding:28px;background:#ffffff;color:#1a1a1a;' +
    "font-family:system-ui,'Segoe UI',Roboto,sans-serif;line-height:1.6;"
  wrap.innerHTML = `<style>${LIST_CSS}</style><h1 style="font-size:22px;margin:0 0 12px">${esc(displayTitle)}</h1>${html || ''}`
  wrap.querySelectorAll('img').forEach((img) => ((img as HTMLImageElement).style.maxWidth = '100%'))
  document.body.appendChild(wrap)
  try {
    const dataUrl = await toPng(wrap, { pixelRatio: 2, backgroundColor: '#ffffff' })
    download(dataUrl, `${fileTitle}.png`)
  } finally {
    wrap.remove()
  }
}

function docxExport(html: string, displayTitle: string, fileTitle: string) {
  // Word opens HTML saved with a Word MIME type, and the file stays editable.
  // Dependency-free and reliable; true OOXML generation needs a heavy library
  // that does not bundle cleanly for the browser.
  const doc = wrapDoc(html, displayTitle)
  download(new Blob(['﻿' + doc], { type: 'application/msword' }), `${fileTitle}.doc`)
}

/** Export a node's note (HTML) in the chosen format. */
export async function exportNote(format: NoteFormat, html: string, titleRaw: string): Promise<void> {
  const title = titleRaw?.trim() || 'Note'
  const file = safeName(titleRaw)
  switch (format) {
    case 'txt':
      download(new Blob([htmlToText(html)], { type: 'text/plain;charset=utf-8' }), `${file}.txt`)
      return
    case 'md':
      download(new Blob([`# ${title}\n\n${toMarkdown(html)}`], { type: 'text/markdown;charset=utf-8' }), `${file}.md`)
      return
    case 'pdf':
      printPdf(html, title)
      return
    case 'png':
      await pngExport(html, file, title)
      return
    case 'docx':
      docxExport(html, title, file)
      return
  }
}
