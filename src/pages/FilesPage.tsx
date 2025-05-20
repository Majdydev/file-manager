import React, { useEffect, useState } from "react";
import { getDb } from "../db";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import { File, Category } from "../types";
import {
  Plus,
  Trash2,
  FileText,
  Search,
  SortDesc,
  SortAsc,
  Calendar,
} from "lucide-react";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filteredFiles, setFilteredFiles] = useState<File[]>([]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [files, searchQuery, categoryFilter, sortDirection, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, startDate, endDate]);

  const loadData = async () => {
    try {
      const db = getDb();

      const categoriesCount = await db.get(
        "SELECT COUNT(*) as count FROM categories"
      );

      if (categoriesCount.count === 0) {
        await db.execute("INSERT INTO categories (name) VALUES (?)", [
          "Documents",
        ]);
        await db.execute("INSERT INTO categories (name) VALUES (?)", [
          "Images",
        ]);
        await db.execute("INSERT INTO categories (name) VALUES (?)", ["Autre"]);
      }

      const allFiles = await db.query(
        "SELECT * FROM files ORDER BY register_date DESC"
      );
      const allCategories = await db.query(
        "SELECT * FROM categories ORDER BY name"
      );

      setFiles(allFiles);
      setCategories(allCategories);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Échec du chargement des données");
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...files];

    if (categoryFilter) {
      result = result.filter((file) => file.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (file) =>
          file.display_name.toLowerCase().includes(query) ||
          file.description.toLowerCase().includes(query)
      );
    }

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      result = result.filter((file) => {
        const fileDate = new Date(file.register_date).getTime();
        return fileDate >= startTimestamp;
      });
    }

    if (endDate) {
      const endTimestamp = new Date(endDate);
      endTimestamp.setDate(endTimestamp.getDate() + 1);
      result = result.filter((file) => {
        const fileDate = new Date(file.register_date).getTime();
        return fileDate < endTimestamp.getTime();
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.register_date).getTime();
      const dateB = new Date(b.register_date).getTime();

      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });

    setFilteredFiles(result);
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFiles.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("");
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
  };

  const handleSelectFile = async () => {
    try {
      const filePath = await window.electron.openFileDialog();
      if (filePath) {
        setSelectedFile(filePath);
        const fileName = path.basename(filePath);
        setFileDisplayName(fileName);
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      setError("Failed to select file");
    }
  };

  const handleAddCategory = async () => {
    const categoryName = prompt("Entrez le nom de la nouvelle catégorie:");
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
      setError("Échec de l'ajout de la catégorie");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileDisplayName || !fileCategory) {
      setError("Please fill all required fields");
      return;
    }

    try {
      const originalFileName = path.basename(selectedFile);

      const savedFilePath = await window.electron.saveFile(
        selectedFile,
        fileCategory
      );

      if (savedFilePath) {
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

        setSelectedFile(null);
        setFilePath("");
        setFileDisplayName("");
        setFileDescription("");
        setFileCategory("");
        setShowForm(false);

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
    if (
      !confirm(`Êtes-vous sûr de vouloir supprimer "${file.display_name}"?`)
    ) {
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
      header: "Nom",
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
      header: "Catégorie",
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
      header: "Date d'ajout",
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
        <h1 className="text-2xl font-bold text-gray-800">Fichiers</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Annuler" : "Ajouter Fichier"}
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

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rechercher
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
                placeholder="Rechercher par nom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par Catégorie
            </label>
            <div className="flex items-center">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Actions
              </label>
              <button
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                onClick={() => setShowDateFilter(!showDateFilter)}
              >
                <Calendar size={16} className="mr-1" />
                {showDateFilter ? "Masquer filtre date" : "Filtrer par date"}
              </button>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                className="w-full flex justify-center items-center"
                onClick={toggleSortDirection}
              >
                {sortDirection === "asc" ? (
                  <SortAsc size={16} className="mr-2" />
                ) : (
                  <SortDesc size={16} className="mr-2" />
                )}
                {sortDirection === "asc"
                  ? "Date (Ancien → Récent)"
                  : "Date (Récent → Ancien)"}
              </Button>

              <Button
                variant="secondary"
                className="flex-shrink-0"
                onClick={clearFilters}
              >
                Effacer
              </Button>
            </div>
          </div>
        </div>

        {showDateFilter && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
              />
            </div>
          </div>
        )}
      </Card>

      {showForm && (
        <Card className="mb-6" title="Ajouter un Nouveau Fichier">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sélectionner un Fichier
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={selectedFile || ""}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
                      placeholder="Aucun fichier sélectionné"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      className="ml-2"
                      onClick={handleSelectFile}
                    >
                      Parcourir
                    </Button>
                  </div>
                </div>

                <Input
                  label="Nom d'affichage"
                  value={fileDisplayName}
                  onChange={(e) => setFileDisplayName(e.target.value)}
                  required
                />

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <div className="flex items-center">
                    <select
                      value={fileCategory}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setFileCategory(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
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
                      Nouveau
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
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                Enregistrer
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {files.length > 0 ? (
          <>
            <div className="mb-2 text-sm text-gray-500">
              {filteredFiles.length} fichier(s) trouvé(s)
              {(searchQuery || categoryFilter || startDate || endDate) && (
                <span> avec les filtres appliqués</span>
              )}
            </div>
            <DataTable
              columns={columns}
              data={getCurrentPageData()}
              keyExtractor={(file) => file.id.toString()}
              actions={fileActions}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              Aucun fichier
            </h3>
            <p className="text-gray-400 mb-4">
              Ajoutez votre premier fichier pour commencer
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Ajouter un Fichier
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FilesPage;
