/// <reference types="vite/client" />

interface Window {
  electron: {
    getStoragePath: () => Promise<string>;
    getDbPath: () => Promise<string>;
    openFileDialog: () => Promise<string | null>;
    createCategoryFolder: (categoryName: string) => Promise<string>;
    // Update the saveFile signature to accept category instead of destination path
    saveFile: (sourcePath: string, category: string) => Promise<string>;
    // Database operations
    dbExecute: (sql: string, params?: any[]) => Promise<any>;
    dbQuery: (sql: string, params?: any[]) => Promise<any[]>;
    dbGet: (sql: string, params?: any[]) => Promise<any>;
  };
}
