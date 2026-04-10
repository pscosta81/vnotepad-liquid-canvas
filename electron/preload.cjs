const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ping: () => ipcRenderer.invoke('ping'),
  exportXlsx: (data, pin) => ipcRenderer.invoke('export-xlsx', data, pin),
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(event, ...args)),
  removeListener: (channel, callback) => ipcRenderer.removeListener(channel, callback)
});

