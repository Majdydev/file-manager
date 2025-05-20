import React, { useEffect, useState } from "react";
import { getDb } from "../db";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import { Rendezvous, Passion } from "../types";
import {
  Plus,
  Trash2,
  Edit,
  Calendar,
  Check,
  X,
  Search,
  SortAsc,
  SortDesc,
  Filter,
} from "lucide-react";

const RendezvousPage: React.FC = () => {
  const [rendezvous, setRendezvous] = useState<Rendezvous[]>([]);
  const [passions, setPassions] = useState<Passion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Rendezvous | null>(null);
  const [passionId, setPassionId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"pending" | "completed" | "canceled">(
    "pending"
  );
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortField, setSortField] = useState<"passion_name" | "date">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filteredRendezvous, setFilteredRendezvous] = useState<Rendezvous[]>(
    []
  );
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
  }, [
    rendezvous,
    searchQuery,
    statusFilter,
    sortField,
    sortDirection,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortField, sortDirection, startDate, endDate]);

  const loadData = async () => {
    try {
      const db = getDb();

      const allRendezvous = await db.query(`
        SELECT r.*, p.name as passion_name 
        FROM rendezvous r
        JOIN passions p ON r.passion_id = p.id
        ORDER BY r.date DESC
      `);

      const allPassions = await db.query(
        "SELECT * FROM passions ORDER BY name"
      );

      setRendezvous(allRendezvous);
      setPassions(allPassions);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Échec du chargement des données");
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...rendezvous];

    if (statusFilter) {
      result = result.filter((rendez) => rendez.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((rendez) => {
        const passionName = rendez.passion_name?.toLowerCase() || "";
        const desc = rendez.description.toLowerCase();
        return passionName.includes(query) || desc.includes(query);
      });
    }

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      result = result.filter((rendez) => {
        const rendezvousDate = new Date(rendez.date).getTime();
        return rendezvousDate >= startTimestamp;
      });
    }

    if (endDate) {
      const endTimestamp = new Date(endDate);
      endTimestamp.setDate(endTimestamp.getDate() + 1);
      result = result.filter((rendez) => {
        const rendezvousDate = new Date(rendez.date).getTime();
        return rendezvousDate < endTimestamp.getTime();
      });
    }

    result.sort((a, b) => {
      if (sortField === "passion_name") {
        const nameA = a.passion_name?.toLowerCase() || "";
        const nameB = b.passion_name?.toLowerCase() || "";
        return sortDirection === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }
    });

    setFilteredRendezvous(result);
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRendezvous.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.ceil(filteredRendezvous.length / itemsPerPage);

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const changeSortField = (field: "passion_name" | "date") => {
    if (sortField === field) {
      toggleSortDirection();
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
    setSortField("date");
    setSortDirection("desc");
  };

  const resetForm = () => {
    setPassionId("");
    setDate("");
    setDescription("");
    setStatus("pending");
    setEditing(null);
    setShowForm(false);
  };

  const handleEditRendezvous = (rendez: Rendezvous) => {
    setEditing(rendez);
    setPassionId(rendez.passion_id.toString());
    setDate(new Date(rendez.date).toISOString().split("T")[0]);
    setDescription(rendez.description);
    setStatus(rendez.status as "pending" | "completed" | "canceled");
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passionId || !date) {
      setError("La passion et la date sont requises");
      return;
    }

    try {
      const db = getDb();

      if (editing) {
        await db.execute(
          `
          UPDATE rendezvous
          SET passion_id = ?, date = ?, description = ?, status = ?
          WHERE id = ?
        `,
          [passionId, date, description, status, editing.id]
        );
      } else {
        await db.execute(
          `
          INSERT INTO rendezvous (passion_id, date, description, status)
          VALUES (?, ?, ?, ?)
        `,
          [passionId, date, description, status]
        );
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error saving rendezvous:", error);
      setError("Failed to save rendezvous");
    }
  };

  const handleDeleteRendezvous = async (rendez: Rendezvous) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce rendez-vous?`)) {
      return;
    }

    try {
      const db = getDb();
      await db.execute("DELETE FROM rendezvous WHERE id = ?", [rendez.id]);
      await loadData();
    } catch (error) {
      console.error("Error deleting rendezvous:", error);
      setError("Failed to delete rendezvous");
    }
  };

  const handleUpdateStatus = async (
    rendez: Rendezvous,
    newStatus: "pending" | "completed" | "canceled"
  ) => {
    try {
      const db = getDb();
      await db.execute("UPDATE rendezvous SET status = ? WHERE id = ?", [
        newStatus,
        rendez.id,
      ]);
      await loadData();
    } catch (error) {
      console.error("Error updating status:", error);
      setError("Failed to update status");
    }
  };

  const columns = [
    {
      key: "passion_name",
      header: "Passion",
      sortable: true,
    },
    {
      key: "date",
      header: "Date",
      render: (rendez: Rendezvous) =>
        new Date(rendez.date).toLocaleDateString(),
      sortable: true,
    },
    {
      key: "description",
      header: "Description",
    },
    {
      key: "status",
      header: "Statut",
      render: (rendez: Rendezvous) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          completed: "bg-green-100 text-green-800",
          canceled: "bg-red-100 text-red-800",
        };

        const statusText = {
          pending: "En attente",
          completed: "Terminé",
          canceled: "Annulé",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              statusColors[rendez.status as keyof typeof statusColors]
            }`}
          >
            {statusText[rendez.status as keyof typeof statusText]}
          </span>
        );
      },
      sortable: true,
    },
  ];

  const rendezvousActions = (rendez: Rendezvous) => (
    <div className="flex space-x-2">
      {rendez.status === "pending" && (
        <>
          <Button
            variant="success"
            size="sm"
            className="p-1"
            onClick={() => handleUpdateStatus(rendez, "completed")}
            aria-label="Mark as completed"
          >
            <Check size={16} />
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="p-1"
            onClick={() => handleUpdateStatus(rendez, "canceled")}
            aria-label="Mark as canceled"
          >
            <X size={16} />
          </Button>
        </>
      )}
      <Button
        variant="secondary"
        size="sm"
        className="p-1"
        onClick={() => handleEditRendezvous(rendez)}
        aria-label="Edit rendezvous"
      >
        <Edit size={16} />
      </Button>
      <Button
        variant="danger"
        size="sm"
        className="p-1"
        onClick={() => handleDeleteRendezvous(rendez)}
        aria-label="Delete rendezvous"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Rendez-vous</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Annuler" : "Ajouter un Rendez-vous"}
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
          {/* Search input */}
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
                placeholder="Rechercher par passion ou description"
              />
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrer par Statut
            </label>
            <div className="flex items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="completed">Terminé</option>
                <option value="canceled">Annulé</option>
              </select>
            </div>
          </div>

          {/* Sort controls */}
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
                variant={sortField === "passion_name" ? "primary" : "secondary"}
                className="flex-1 flex justify-center items-center"
                onClick={() => changeSortField("passion_name")}
              >
                {sortField === "passion_name" &&
                  (sortDirection === "asc" ? (
                    <SortAsc size={16} className="mr-2" />
                  ) : (
                    <SortDesc size={16} className="mr-2" />
                  ))}
                Passion
              </Button>

              <Button
                variant={sortField === "date" ? "primary" : "secondary"}
                className="flex-1 flex justify-center items-center"
                onClick={() => changeSortField("date")}
              >
                {sortField === "date" &&
                  (sortDirection === "asc" ? (
                    <SortAsc size={16} className="mr-2" />
                  ) : (
                    <SortDesc size={16} className="mr-2" />
                  ))}
                Date
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

        {/* Date filter section */}
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
            editing
              ? "Modifier le Rendez-vous"
              : "Ajouter un Nouveau Rendez-vous"
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passion
                  </label>
                  <select
                    value={passionId}
                    onChange={(e) => setPassionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
                    required
                  >
                    <option value="">Sélectionner une passion</option>
                    {passions.map((passion) => (
                      <option key={passion.id} value={passion.id}>
                        {passion.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as "pending" | "completed" | "canceled"
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#147D9E] focus:border-[#147D9E]"
                  >
                    <option value="pending">En attente</option>
                    <option value="completed">Terminé</option>
                    <option value="canceled">Annulé</option>
                  </select>
                </div>

                <Textarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
        {rendezvous.length > 0 ? (
          <>
            <div className="mb-2 text-sm text-gray-500">
              {filteredRendezvous.length} rendez-vous trouvé(s)
              {(searchQuery || statusFilter || startDate || endDate) && (
                <span> avec les filtres appliqués</span>
              )}
            </div>
            <DataTable
              columns={columns}
              data={getCurrentPageData()}
              keyExtractor={(rendez) => rendez.id.toString()}
              actions={rendezvousActions}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              Aucun rendez-vous
            </h3>
            <p className="text-gray-400 mb-4">
              Planifiez votre premier rendez-vous
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Ajouter un Rendez-vous
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RendezvousPage;
