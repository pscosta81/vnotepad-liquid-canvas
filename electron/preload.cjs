const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ping: () => ipcRenderer.invoke('ping'),
  exportXlsx: (data, pin) => ipcRenderer.invoke('export-xlsx', data, pin)
});
