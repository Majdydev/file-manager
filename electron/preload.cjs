const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electron", {
  getStoragePath: () => ipcRenderer.invoke("get-storage-path"),
  getDbPath: () => ipcRenderer.invoke("get-db-path"),
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  createCategoryFolder: (categoryName) =>
    ipcRenderer.invoke("create-category-folder", categoryName),
  // Update the saveFile to match the new implementation
  saveFile: (sourcePath, category) =>
    ipcRenderer.invoke("save-file", sourcePath, category),

  // Database operation methods
  dbExecute: (sql, params) => ipcRenderer.invoke("db-execute", sql, params),
  dbQuery: (sql, params) => ipcRenderer.invoke("db-query", sql, params),
  dbGet: (sql, params) => ipcRenderer.invoke("db-get", sql, params),
});
