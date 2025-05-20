import React, { useEffect, useState } from "react";
import { getDb } from "../db";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import Select from "../components/Select";
import DataTable from "../components/DataTable";
import { File, Category } from "../types";
import { Plus, Trash2, FileText, Download } from "lucide-react";
import path from "path-browserify";

const FilesPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [filePath, setFilePath] = useState<string>("");
  const [fileDisplayName, setFileDisplayName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [fileCategory, setFileCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const db = getDb();

      // Check if categories table is empty
      const categoriesCount = await db.get(
        "SELECT COUNT(*) as count FROM categories"
      );

      if (categoriesCount.count === 0) {
        // Create some default categories if there are none
        await db.execute("INSERT INTO categories (name) VALUES (?)", [
          "Documents",
        ]);
        await db.execute("INSERT INTO categories (name) VALUES (?)", [
          "Images",
        ]);
        await db.execute("INSERT INTO categories (name) VALUES (?)", ["Other"]);
      }

      // Get all files using the new async API
      const allFiles = await db.query(
        "SELECT * FROM files ORDER BY register_date DESC"
      );
      // Get all categories for dropdown
      const allCategories = await db.query(
        "SELECT * FROM categories ORDER BY name"
      );

      setFiles(allFiles);
      setCategories(allCategories);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data");
    }
  };

  const handleSelectFile = async () => {
    try {
      const filePath = await window.electron.openFileDialog();
      if (filePath) {
        setSelectedFile(filePath);
        // Extract filename without extension as the display name
        const fileName = path.basename(filePath);
        setFileDisplayName(fileName);
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      setError("Failed to select file");
    }
  };

  const handleAddCategory = async () => {
    const categoryName = prompt("Enter new category name:");
    if (!categoryName) return;

    try {
      const db = getDb();
      await db.execute("INSERT INTO categories (name) VALUES (?)", [
        categoryName,
      ]);
      await loadData();
      setFileCategory(categoryName);
    } catch (error) {
      console.error("Error adding category:", error);
      setError("Failed to add category");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileDisplayName || !fileCategory) {
      setError("Please fill all required fields");
      return;
    }

    try {
      // Get original filename
      const originalFileName = path.basename(selectedFile);

      // Save the file directly to the category folder
      // The main process will handle creating the folder if needed
      const savedFilePath = await window.electron.saveFile(
        selectedFile,
        fileCategory
      );

      if (savedFilePath) {
        // Save metadata to database
        const db = getDb();
        await db.execute(
          `INSERT INTO files (name, display_name, description, category, file_path)
           VALUES (?, ?, ?, ?, ?)`,
          [
            originalFileName,
            fileDisplayName,
            fileDescription,
            fileCategory,
            savedFilePath,
          ]
        );

        // Reset form
        setSelectedFile(null);
        setFilePath("");
        setFileDisplayName("");
        setFileDescription("");
        setFileCategory("");
        setShowForm(false);

        // Reload data
        await loadData();
      } else {
        setError("Failed to save file");
      }
    } catch (error) {
      console.error("Error saving file:", error);
      setError("Failed to save file");
    }
  };

  const handleDeleteFile = async (file: File) => {
    if (!confirm(`Are you sure you want to delete "${file.display_name}"?`)) {
      return;
    }

    try {
      const db = getDb();
      await db.execute("DELETE FROM files WHERE id = ?", [file.id]);
      await loadData();
    } catch (error) {
      console.error("Error deleting file:", error);
      setError("Failed to delete file");
    }
  };

  const columns = [
    {
      key: "display_name",
      header: "Name",
      render: (file: File) => (
        <div className="flex items-center">
          <FileText size={18} className="mr-2 text-gray-500" />
          <span>{file.display_name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      render: (file: File) => (
        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
          {file.category}
        </span>
      ),
      sortable: true,
    },
    {
      key: "description",
      header: "Description",
      render: (file: File) => (
        <span>
          {file.description.substring(0, 50)}
          {file.description.length > 50 ? "..." : ""}
        </span>
      ),
    },
    {
      key: "register_date",
      header: "Date Added",
      render: (file: File) => new Date(file.register_date).toLocaleDateString(),
      sortable: true,
    },
  ];

  const fileActions = (file: File) => (
    <div className="flex space-x-2">
      <Button
        variant="danger"
        size="sm"
        className="p-1"
        onClick={() => handleDeleteFile(file)}
        aria-label="Delete file"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Files</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "Add File"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button className="float-right" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {showForm && (
        <Card className="mb-6" title="Add New File">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select File
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={selectedFile || ""}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
                      placeholder="No file selected"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="ml-2"
                      onClick={handleSelectFile}
                    >
                      Browse
                    </Button>
                  </div>
                </div>

                <Input
                  label="Display Name"
                  value={fileDisplayName}
                  onChange={(e) => setFileDisplayName(e.target.value)}
                  required
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="flex items-center">
                    <select
                      value={fileCategory}
                      onChange={(e) => setFileCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="secondary"
                      className="ml-2"
                      onClick={handleAddCategory}
                    >
                      New
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Textarea
                  label="Description"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  rows={5}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save File
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {files.length > 0 ? (
          <DataTable
            columns={columns}
            data={files}
            keyExtractor={(file) => file.id.toString()}
            actions={fileActions}
          />
        ) : (
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              No files yet
            </h3>
            <p className="text-gray-400 mb-4">
              Add your first file to get started
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Add File
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FilesPage;
