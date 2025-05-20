const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  getStoragePath: () => ipcRenderer.invoke("get-storage-path"),
  getDbPath: () => ipcRenderer.invoke("get-db-path"),
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  createCategoryFolder: (categoryName) =>
    ipcRenderer.invoke("create-category-folder", categoryName),
  saveFile: (sourcePath, destinationPath) =>
    ipcRenderer.invoke("save-file", sourcePath, destinationPath),
});
