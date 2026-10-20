const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  installUpdateExe: (payload) => ipcRenderer.invoke('install-update-exe', payload),
});
