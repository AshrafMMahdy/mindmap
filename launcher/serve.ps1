# MindMap — self-contained local server.
# Serves the built `dist` folder over http://localhost using only built-in
# Windows PowerShell (System.Net.HttpListener). No Node, no install, no extra
# binary. Loopback (localhost) prefixes do not require admin rights.

param(
  [string]$Root = '',
  [int]$Port = 8765
)
$ErrorActionPreference = 'Stop'

# Locate dist/index.html relative to this script (covers common layouts).
if (-not $Root) {
  $candidates = @(
    (Join-Path $PSScriptRoot 'dist'),
    $PSScriptRoot,
    (Join-Path $PSScriptRoot '..\dist')
  )
  foreach ($c in $candidates) {
    if (Test-Path (Join-Path $c 'index.html')) { $Root = (Resolve-Path $c).Path; break }
  }
}
if (-not $Root -or -not (Test-Path (Join-Path $Root 'index.html'))) {
  Write-Host "ERROR: could not find dist\index.html next to this script." -ForegroundColor Red
  Write-Host "Place start.bat and serve.ps1 in the folder that contains 'dist'."
  Read-Host "Press Enter to exit"
  exit 1
}
$Root = (Resolve-Path $Root).Path

$mime = @{
  '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript'; '.mjs' = 'text/javascript'; '.css' = 'text/css'
  '.json' = 'application/json'; '.svg' = 'image/svg+xml'; '.png' = 'image/png'
  '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.gif' = 'image/gif'; '.webp' = 'image/webp'
  '.ico' = 'image/x-icon'; '.woff' = 'font/woff'; '.woff2' = 'font/woff2'; '.ttf' = 'font/ttf'
  '.map' = 'application/json'; '.txt' = 'text/plain; charset=utf-8'
}

# Bind to the first free port from $Port upward.
$listener = $null
for ($p = $Port; $p -lt ($Port + 25); $p++) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    $listener = $l; $Port = $p; break
  } catch {
    if ($l) { $l.Close() }
  }
}
if (-not $listener) {
  Write-Host "ERROR: could not open a local port." -ForegroundColor Red
  Read-Host "Press Enter to exit"; exit 1
}

$url = "http://localhost:$Port/"
Write-Host ""
Write-Host "  MindMap is running at $url" -ForegroundColor Green
Write-Host "  Serving: $Root"
Write-Host "  Keep this window open. Close it to stop MindMap." -ForegroundColor DarkGray
Write-Host ""
Start-Process $url

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response
    try {
      $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
      if ($rel -eq '/') { $rel = '/index.html' }
      $full = [System.IO.Path]::GetFullPath((Join-Path $Root $rel.TrimStart('/').Replace('/', '\')))
      # path-traversal guard + SPA fallback
      if (-not $full.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase) -or
          -not (Test-Path $full -PathType Leaf)) {
        $full = Join-Path $Root 'index.html'
      }
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $ext = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
      $ct = $mime[$ext]; if (-not $ct) { $ct = 'application/octet-stream' }
      $res.ContentType = $ct
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
      try { $res.StatusCode = 500 } catch {}
    } finally {
      try { $res.OutputStream.Close() } catch {}
    }
  }
} finally {
  $listener.Stop(); $listener.Close()
}
