import React, { useEffect, useState } from "react";
import { getDb } from "../db";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import DataTable from "../components/DataTable";
import { Category } from "../types";
import { Plus, Trash2, FolderOpen, Edit } from "lucide-react";

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const db = getDb();
      const result = await db.query("SELECT * FROM categories ORDER BY name");
      setCategories(result);
    } catch (error) {
      console.error("Error loading categories:", error);
      setError("Échec du chargement des catégories");
    }
  };

  const resetForm = () => {
    setCategoryName("");
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError("Le nom de la catégorie est requis");
      return;
    }

    try {
      const db = getDb();

      if (editing) {
        // Update existing category
        await db.execute("UPDATE categories SET name = ? WHERE id = ?", [
          categoryName,
          editing.id,
        ]);
      } else {
        // Create new category
        await db.execute("INSERT INTO categories (name) VALUES (?)", [
          categoryName,
        ]);
      }

      resetForm();
      loadCategories();
    } catch (error) {
      console.error("Error saving category:", error);

      if (
        error instanceof Error &&
        error.message.includes("UNIQUE constraint failed")
      ) {
        setError("Une catégorie avec ce nom existe déjà");
      } else {
        setError("Échec de l'enregistrement de la catégorie");
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditing(category);
    setCategoryName(category.name);
    setShowForm(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      // Check if category has associated files
      const db = getDb();
      const filesCount = await db.get(
        "SELECT COUNT(*) as count FROM files WHERE category = ?",
        [category.name]
      );

      if (filesCount.count > 0) {
        setError(
          `Impossible de supprimer: La catégorie "${category.name}" a ${filesCount.count} fichier(s) associé(s)`
        );
        return;
      }

      if (
        !confirm(
          `Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}"?`
        )
      ) {
        return;
      }

      await db.execute("DELETE FROM categories WHERE id = ?", [category.id]);
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      setError("Échec de la suppression de la catégorie");
    }
  };

  const columns = [
    {
      key: "name",
      header: "Nom de la Catégorie",
      render: (category: Category) => (
        <div className="flex items-center">
          <FolderOpen size={18} className="mr-2 text-blue-500" />
          <span>{category.name}</span>
        </div>
      ),
      sortable: true,
    },
  ];

  const categoryActions = (category: Category) => (
    <div className="flex space-x-2">
      <Button
        variant="secondary"
        size="sm"
        className="p-1"
        onClick={() => handleEditCategory(category)}
        aria-label="Edit category"
      >
        <Edit size={16} />
      </Button>
      <Button
        variant="danger"
        size="sm"
        className="p-1"
        onClick={() => handleDeleteCategory(category)}
        aria-label="Delete category"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Catégories</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Annuler" : "Ajouter une Catégorie"}
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
        <Card
          className="mb-6"
          title={
            editing ? "Modifier la Catégorie" : "Ajouter une Nouvelle Catégorie"
          }
        >
          <form onSubmit={handleSubmit}>
            <Input
              label="Nom de la Catégorie"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              placeholder="Entrez le nom de la catégorie"
            />

            <div className="flex justify-end space-x-2 mt-4">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Annuler
              </Button>
              <Button type="submit" variant="primary">
                {editing ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {categories.length > 0 ? (
          <DataTable
            columns={columns}
            data={categories}
            keyExtractor={(category) => category.id.toString()}
            actions={categoryActions}
          />
        ) : (
          <div className="text-center py-8">
            <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              Aucune catégorie
            </h3>
            <p className="text-gray-400 mb-4">
              Créez votre première catégorie pour organiser les fichiers
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Ajouter une Catégorie
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CategoriesPage;
