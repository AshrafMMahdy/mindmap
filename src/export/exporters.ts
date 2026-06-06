import type { ExportFormat, MapEngine } from '../engine/MapEngine'

/** Export the current map via the engine's native exporters (PNG/SVG/PDF…). */
export async function exportMapAs(engine: MapEngine, type: ExportFormat, name: string) {
  await engine.exportMap(type, name)
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => {
    switch (c) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      default: return '&quot;'
    }
  })
}

/** Render the map to PNG and open the browser print dialog (for paper copies). */
export async function printMap(engine: MapEngine, name: string) {
  const dataUrl = await engine.toPng()
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(name)}</title>` +
      `<style>@page{margin:12mm}html,body{margin:0;height:100%}` +
      `body{display:flex;align-items:center;justify-content:center;background:#fff}` +
      `img{max-width:100%;max-height:100%}</style></head>` +
      `<body><img src="${dataUrl}" onload="setTimeout(function(){window.focus();window.print()},100)"></body></html>`,
  )
  w.document.close()
}
