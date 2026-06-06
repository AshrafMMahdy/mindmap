MindMap — local web app launcher
================================

This runs MindMap as a local web app on your own machine. No installation,
no admin rights, no Node.js, no extra programs — it uses the PowerShell that
already ships with Windows.

HOW TO USE
----------
1. Keep these two files (start.bat and serve.ps1) together with the "dist"
   folder. The simplest layout:

       MindMap\
         dist\            <- the built app (index.html, assets, ...)
         start.bat
         serve.ps1

   (start.bat also works if you drop it INSIDE a folder next to dist.)

2. Double-click  start.bat
3. Your default browser opens at  http://localhost:8765
4. To stop MindMap, close the small black PowerShell window.

YOUR DATA
---------
Maps are saved automatically in your browser's local storage (IndexedDB) for
this address. Use  Export  in the top bar to save a .json backup you can copy
between machines, and  Import  to load it back.

NOTES FOR LOCKED-DOWN MACHINES
------------------------------
- Nothing is installed and no .exe is run, so there is no SmartScreen prompt.
- The server listens only on localhost (your machine); nothing is exposed to
  the network.
- If your organisation blocks PowerShell script execution entirely
  (Constrained Language Mode / locked execution policy), use the Electron
  build instead, or host the dist folder on any static web server.
