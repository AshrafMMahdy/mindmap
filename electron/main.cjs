const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')

// Open links / file paths in the OS instead of spawning Electron windows. This
// is what makes pasted hyperlinks and Windows file paths actually open from the
// desktop build (the web build relies on the browser for http links).
function openExternally(url) {
  try {
    if (/^file:/i.test(url)) {
      shell.openPath(decodeURIComponent(url.replace(/^file:\/+/i, '')))
    } else if (/^(https?|mailto|tel):/i.test(url)) {
      shell.openExternal(url)
    }
  } catch {
    /* ignore */
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 920,
    minHeight: 600,
    backgroundColor: '#141318',
    title: 'MindMap',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url)
    return { action: 'deny' }
  })

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  } else {
    win.loadURL(process.env.MM_DEV_URL || 'http://localhost:5173')
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
