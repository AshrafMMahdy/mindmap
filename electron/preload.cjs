const { contextBridge } = require('electron')

// Minimal, safe bridge. The renderer is a standard web app; it only needs to
// know it is running inside Electron (e.g. to adjust copy or enable desktop
// affordances later). File save/open use the normal browser download / file
// input, which Electron handles natively.
contextBridge.exposeInMainWorld('mindmap', {
  isElectron: true,
  platform: process.platform,
})
