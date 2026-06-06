export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 200, height: 120 })
    img.src = dataUrl
  })
}

export function fitImage(w: number, h: number, maxW = 260, maxH = 200) {
  const scale = Math.min(maxW / w, maxH / h, 1)
  return { width: Math.round(w * scale), height: Math.round(h * scale) }
}
