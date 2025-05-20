import React, { useEffect, useState } from "react";
import { getDb } from "../db";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import DataTable from "../components/DataTable";
import Pagination from "../components/Pagination";
import { Visit, Passion } from "../types";
import {
  Plus,
  Trash2,
  Edit,
  ClipboardCheck,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
} from "lucide-react";

const VisitsPage: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [passions, setPassions] = useState<Passion[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Visit | null>(null);
  const [passionId, setPassionId] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [nextVisitDate, setNextVisitDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"passion_name" | "date">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
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
  }, [visits, searchQuery, sortField, sortDirection, startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection, startDate, endDate]);

  const loadData = async () => {
    try {
      const db = getDb();

      const allVisits = await db.query(`
        SELECT v.*, p.name as passion_name 
        FROM visits v
        JOIN passions p ON v.passion_id = p.id
        ORDER BY v.date DESC
      `);

      const allPassions = await db.query(
        "SELECT * FROM passions ORDER BY name"
      );

      setVisits(allVisits);
      setPassions(allPassions);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Échec du chargement des données");
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...visits];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((visit) => {
        const passionName = visit.passion_name?.toLowerCase() || "";
        const visitNotes = visit.notes.toLowerCase();
        return passionName.includes(query) || visitNotes.includes(query);
      });
    }

    if (startDate) {
      const startTimestamp = new Date(startDate).getTime();
      result = result.filter((visit) => {
        const visitDate = new Date(visit.date).getTime();
        return visitDate >= startTimestamp;
      });
    }

    if (endDate) {
      const endTimestamp = new Date(endDate);
      endTimestamp.setDate(endTimestamp.getDate() + 1);
      result = result.filter((visit) => {
        const visitDate = new Date(visit.date).getTime();
        return visitDate < endTimestamp.getTime();
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

    setFilteredVisits(result);
  };

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVisits.slice(startIndex, startIndex + itemsPerPage);
  };

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
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
    setSortField("date");
    setSortDirection("desc");
  };

  const resetForm = () => {
    setPassionId("");
    setDate("");
    setNotes("");
    setNextVisitDate("");
    setEditing(null);
    setShowForm(false);
  };

  const handleEditVisit = (visit: Visit) => {
    setEditing(visit);
    setPassionId(visit.passion_id.toString());
    setDate(new Date(visit.date).toISOString().split("T")[0]);
    setNotes(visit.notes);
    setNextVisitDate(
      visit.next_visit_date
        ? new Date(visit.next_visit_date).toISOString().split("T")[0]
        : ""
    );
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
          UPDATE visits
          SET passion_id = ?, date = ?, notes = ?, next_visit_date = ?
          WHERE id = ?
        `,
          [passionId, date, notes, nextVisitDate || null, editing.id]
        );
      } else {
        await db.execute(
          `
          INSERT INTO visits (passion_id, date, notes, next_visit_date)
          VALUES (?, ?, ?, ?)
        `,
          [passionId, date, notes, nextVisitDate || null]
        );
      }

      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error saving visit:", error);
      setError("Échec de l'enregistrement de la visite");
    }
  };

  const handleDeleteVisit = async (visit: Visit) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette visite?`)) {
      return;
    }

    try {
      const db = getDb();
      await db.execute("DELETE FROM visits WHERE id = ?", [visit.id]);
      await loadData();
    } catch (error) {
      console.error("Error deleting visit:", error);
      setError("Échec de la suppression de la visite");
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
      header: "Date de Visite",
      render: (visit: Visit) => new Date(visit.date).toLocaleDateString(),
      sortable: true,
    },
    {
      key: "notes",
      header: "Notes",
      render: (visit: Visit) => (
        <span className="truncate block max-w-xs">
          {visit.notes.substring(0, 50)}
          {visit.notes.length > 50 ? "..." : ""}
        </span>
      ),
    },
    {
      key: "next_visit_date",
      header: "Prochaine Visite",
      render: (visit: Visit) =>
        visit.next_visit_date
          ? new Date(visit.next_visit_date).toLocaleDateString()
          : "-",
      sortable: true,
    },
  ];

  const visitActions = (visit: Visit) => (
    <div className="flex space-x-2">
      <Button
        variant="secondary"
        size="sm"
        className="p-1"
        onClick={() => handleEditVisit(visit)}
        aria-label="Modifier la visite"
      >
        <Edit size={16} />
      </Button>
      <Button
        variant="danger"
        size="sm"
        className="p-1"
        onClick={() => handleDeleteVisit(visit)}
        aria-label="Supprimer la visite"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Visites</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Annuler" : "Ajouter une Visite"}
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
                placeholder="Rechercher par passion ou notes"
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
          title={editing ? "Modifier la Visite" : "Ajouter une Nouvelle Visite"}
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
                  label="Date de Visite"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />

                <Input
                  label="Date de Prochaine Visite (Optionnel)"
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                />
              </div>

              <div>
                <Textarea
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={8}
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
        {visits.length > 0 ? (
          <>
            <div className="mb-2 text-sm text-gray-500">
              {filteredVisits.length} visite(s) trouvée(s)
              {(searchQuery || startDate || endDate) && (
                <span> avec les filtres appliqués</span>
              )}
            </div>
            <DataTable
              columns={columns}
              data={getCurrentPageData()}
              keyExtractor={(visit) => visit.id.toString()}
              actions={visitActions}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredVisits.length / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center py-8">
            <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              Aucune visite
            </h3>
            <p className="text-gray-400 mb-4">
              Enregistrez votre première visite
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Ajouter une Visite
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VisitsPage;
