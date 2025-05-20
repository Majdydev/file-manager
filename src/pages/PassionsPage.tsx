import React, { useEffect, useState } from "react";
import { getDb } from "../db";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import { Passion } from "../types";
import {
  Plus,
  Trash2,
  Edit,
  User,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
} from "lucide-react";

const PassionsPage: React.FC = () => {
  const [passions, setPassions] = useState<Passion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Passion | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"name" | "register_date">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filteredPassions, setFilteredPassions] = useState<Passion[]>([]);

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
  }, [passions, searchQuery, sortField, sortDirection, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection, startDate, endDate]);

  const loadData = async () => {
    try {
      const db = getDb();
      const allPassions = await db.query(
        "SELECT * FROM passions ORDER BY name"
      );
      setPassions(allPassions);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Échec du chargement des données");
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setNotes("");
    setEditing(null);
    setShowForm(false);
  };

  const handleEditPassion = (passion: Passion) => {
    setEditing(passion);
    setName(passion.name);
    setPhone(passion.phone || "");
    setEmail(passion.email || "");
    setAddress(passion.address || "");
    setNotes(passion.notes || "");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Le nom est requis");
      return;
    }

    try {
      const db = getDb();

      if (editing) {
        await db.execute(
          `
          UPDATE passions
          SET name = ?, phone = ?, email = ?, address = ?, notes = ?
          WHERE id = ?
        `,
          [name, phone, email, address, notes, editing.id]
        );
      } else {
        await db.execute(
          `
          INSERT INTO passions (name, phone, email, address, notes)
          VALUES (?, ?, ?, ?, ?)
        `,
          [name, phone, email, address, notes]
        );
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error saving passion:", error);
      setError("Failed to save passion");
    }
  };

  const handleDeletePassion = async (passion: Passion) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${passion.name}"?`)) {
      return;
    }

    try {
      const db = getDb();

      const rendezvousCount = await db.get(
        "SELECT COUNT(*) as count FROM rendezvous WHERE passion_id = ?",
        [passion.id]
      );
      const visitsCount = await db.get(
        "SELECT COUNT(*) as count FROM visits WHERE passion_id = ?",
        [passion.id]
      );

      if (rendezvousCount.count > 0 || visitsCount.count > 0) {
        const message = `Impossible de supprimer: Cette passion a ${rendezvousCount.count} rendez-vous et ${visitsCount.count} visites associés.`;
        setError(message);
        return;
      }

      await db.execute("DELETE FROM passions WHERE id = ?", [passion.id]);
      await loadData();
    } catch (error) {
      console.error("Error deleting passion:", error);
      setError("Échec de la suppression de la passion");
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...passions];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (passion) =>
          passion.name.toLowerCase().includes(query) ||
          (passion.email && passion.email.toLowerCase().includes(query)) ||
          (passion.phone && passion.phone.toLowerCase().includes(query))
      );
    }

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      result = result.filter((passion) => {
        const passionDate = new Date(passion.register_date).getTime();
        return passionDate >= startTimestamp;
      });
    }

    if (endDate) {
      const endTimestamp = new Date(endDate);
      endTimestamp.setDate(endTimestamp.getDate() + 1);
      result = result.filter((passion) => {
        const passionDate = new Date(passion.register_date).getTime();
        return passionDate < endTimestamp.getTime();
      });
    }

    result.sort((a, b) => {
      if (sortField === "name") {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortDirection === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else {
        const dateA = new Date(a.register_date).getTime();
        const dateB = new Date(b.register_date).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
    });

    setFilteredPassions(result);
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const changeSortField = (field: "name" | "register_date") => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSortField("name");
    setSortDirection("asc");
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPassions.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredPassions.length / itemsPerPage);

  const columns = [
    {
      key: "name",
      header: "Nom",
      render: (passion: Passion) => (
        <div className="flex items-center">
          <User size={18} className="mr-2 text-gray-500" />
          <span className="font-medium">{passion.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "phone",
      header: "Téléphone",
      sortable: true,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
    },
    {
      key: "register_date",
      header: "Date d'ajout",
      render: (passion: Passion) =>
        new Date(passion.register_date).toLocaleDateString(),
      sortable: true,
    },
  ];

  const passionActions = (passion: Passion) => (
    <div className="flex space-x-2">
      <Button
        variant="secondary"
        size="sm"
        className="p-1"
        onClick={() => handleEditPassion(passion)}
        aria-label="Edit passion"
      >
        <Edit size={16} />
      </Button>
      <Button
        variant="danger"
        size="sm"
        className="p-1"
        onClick={() => handleDeletePassion(passion)}
        aria-label="Delete passion"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Passions</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Annuler" : "Ajouter une Passion"}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="Rechercher par nom, email ou téléphone"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Trier par
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
                variant={sortField === "name" ? "primary" : "secondary"}
                className="flex-1 flex justify-center items-center"
                onClick={() => changeSortField("name")}
              >
                {sortField === "name" &&
                  (sortDirection === "asc" ? (
                    <SortAsc size={16} className="mr-2" />
                  ) : (
                    <SortDesc size={16} className="mr-2" />
                  ))}
                Nom
              </Button>

              <Button
                variant={
                  sortField === "register_date" ? "primary" : "secondary"
                }
                className="flex-1 flex justify-center items-center"
                onClick={() => changeSortField("register_date")}
              >
                {sortField === "register_date" &&
                  (sortDirection === "asc" ? (
                    <SortAsc size={16} className="mr-2" />
                  ) : (
                    <SortDesc size={16} className="mr-2" />
                  ))}
                Date d'ajout
              </Button>

              <Button
                variant="secondary"
                className="flex-shrink-0"
                onClick={clearFilters}
              >
                Réinitialiser
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
        <Card
          className="mb-6"
          title={
            editing ? "Modifier la Passion" : "Ajouter une Nouvelle Passion"
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  label="Téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Adresse"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <Textarea
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

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
        {passions.length > 0 ? (
          <>
            <div className="mb-2 text-sm text-gray-500">
              {filteredPassions.length} passion(s) trouvée(s)
              {(searchQuery || startDate || endDate) && (
                <span> avec les filtres appliqués</span>
              )}
            </div>
            <DataTable
              columns={columns}
              data={getCurrentPageData()}
              keyExtractor={(passion) => passion.id.toString()}
              actions={passionActions}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <User size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              Aucune passion
            </h3>
            <p className="text-gray-400 mb-4">
              Ajoutez votre première passion pour commencer
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Ajouter une Passion
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PassionsPage;
