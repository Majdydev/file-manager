const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");

let mainWindow;
let dbPath;
let storagePath;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Set up application paths
  const userDataPath = app.getPath("userData");
  dbPath = path.join(userDataPath, "database.db");
  storagePath = path.join(userDataPath, "storage");

  // Ensure storage directory exists
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers
ipcMain.handle("get-storage-path", () => {
  return storagePath;
});

ipcMain.handle("get-db-path", () => {
  return dbPath;
});

ipcMain.handle("open-file-dialog", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("create-category-folder", async (_, categoryName) => {
  const categoryPath = path.join(storagePath, categoryName);

  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }

  return categoryPath;
});

ipcMain.handle("save-file", async (_, sourcePath, destinationPath) => {
  try {
    await fs.promises.copyFile(sourcePath, destinationPath);
    return true;
  } catch (error) {
    console.error("Error saving file:", error);
    return false;
  }
});
