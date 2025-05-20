const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const isDev = require("electron-is-dev");
const Database = require("better-sqlite3");

let mainWindow;
let dbPath;
let storagePath;
let db; // Database instance

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: true, // Enable Node integration here
      enableRemoteModule: true, // Also enable remote module
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

  // Create the data directory for file storage
  const dataPath = path.join(storagePath, "data");
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  // Initialize the database in the main process
  db = new Database(dbPath);
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

// IPC handlers for file operations
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
  // Create the category folder inside the data directory
  const dataPath = path.join(storagePath, "data");
  const categoryPath = path.join(dataPath, categoryName);

  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }

  return categoryPath;
});

ipcMain.handle("save-file", async (_, sourcePath, destinationCategory) => {
  try {
    // Ensure the data directory exists
    const dataPath = path.join(storagePath, "data");
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }

    // Ensure the category directory exists
    const categoryPath = path.join(dataPath, destinationCategory);
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }

    // Create a filename with timestamp
    const sourceFileName = path.basename(sourcePath);
    const timestamp = Date.now();
    const targetFileName = `${timestamp}-${sourceFileName}`;

    // Create the full destination path
    const destinationPath = path.join(categoryPath, targetFileName);

    // Copy the file
    await fs.promises.copyFile(sourcePath, destinationPath);

    // Return the full path for database storage
    return destinationPath;
  } catch (error) {
    console.error("Error saving file:", error);
    throw error; // Let the renderer process handle the error
  }
});

// New IPC handlers for database operations
ipcMain.handle("db-execute", async (_, sql, params = []) => {
  try {
    if (!db) {
      db = new Database(dbPath);
    }
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return result;
  } catch (error) {
    console.error("Database execution error:", error);
    throw error;
  }
});

ipcMain.handle("db-query", async (_, sql, params = []) => {
  try {
    if (!db) {
      db = new Database(dbPath);
    }
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
});

ipcMain.handle("db-get", async (_, sql, params = []) => {
  try {
    if (!db) {
      db = new Database(dbPath);
    }
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return row;
  } catch (error) {
    console.error("Database get error:", error);
    throw error;
  }
});
