const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('physicaxAI', {
  chat: (message, history) => ipcRenderer.invoke('ai:chat', message, history),
});
