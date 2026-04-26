import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("physicaxDesktop", {
  getBackendUrl: () => ipcRenderer.invoke("physicax:get-backend-url"),
  getSettings: () => ipcRenderer.invoke("physicax:get-settings"),
  getReleaseVerification: () => ipcRenderer.invoke("physicax:get-release-verification"),
  setGpuMode: (mode: "high" | "low") => ipcRenderer.invoke("physicax:set-gpu-mode", mode),
  checkForUpdates: () => ipcRenderer.invoke("physicax:check-updates"),
  getVersion: () => ipcRenderer.invoke("physicax:get-version"),
  openUpdateFolder: () => ipcRenderer.invoke("physicax:open-update-folder")
});
