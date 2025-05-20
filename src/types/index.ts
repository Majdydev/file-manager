export interface Category {
  id: number;
  name: string;
}

export interface File {
  id: number;
  name: string;
  display_name: string;
  description: string;
  category: string;
  file_path: string;
  register_date: string;
}

export interface Passion {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  register_date: string;
}

export interface Rendezvous {
  id: number;
  passion_id: number;
  passion_name?: string; // Joined field
  date: string;
  description: string;
  status: "pending" | "completed" | "canceled";
  notification_state: "pending" | "sent" | "failed";
}

export interface Visit {
  id: number;
  passion_id: number;
  passion_name?: string; // Joined field
  date: string;
  notes: string;
  next_visit_date: string | null;
}

// Extend the Window interface
declare global {
  interface Window {
    electron: {
      getStoragePath: () => Promise<string>;
      getDbPath: () => Promise<string>;
      openFileDialog: () => Promise<string | null>;
      createCategoryFolder: (categoryName: string) => Promise<string>;
      // Update the saveFile method signature to match the new implementation
      saveFile: (sourcePath: string, category: string) => Promise<string>;
      // Database methods
      dbExecute: (sql: string, params?: any[]) => Promise<any>;
      dbQuery: (sql: string, params?: any[]) => Promise<any[]>;
      dbGet: (sql: string, params?: any[]) => Promise<any>;
    };
  }
}
