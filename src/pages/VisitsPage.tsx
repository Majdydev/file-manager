import React, { useEffect, useState } from "react";
import { getDb } from "../db";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import DataTable from "../components/DataTable";
import { Visit, Passion } from "../types";
import { Plus, Trash2, Edit, ClipboardCheck } from "lucide-react";

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const db = getDb();

      // Get all visits with passion names using the new async API
      const allVisits = await db.query(`
        SELECT v.*, p.name as passion_name 
        FROM visits v
        JOIN passions p ON v.passion_id = p.id
        ORDER BY v.date DESC
      `);

      // Get all passions for dropdown using the new async API
      const allPassions = await db.query(
        "SELECT * FROM passions ORDER BY name"
      );

      setVisits(allVisits);
      setPassions(allPassions);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data");
    }
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
      setError("Passion and date are required");
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
      setError("Failed to save visit");
    }
  };

  const handleDeleteVisit = async (visit: Visit) => {
    if (!confirm(`Are you sure you want to delete this visit?`)) {
      return;
    }

    try {
      const db = getDb();
      await db.execute("DELETE FROM visits WHERE id = ?", [visit.id]);
      await loadData();
    } catch (error) {
      console.error("Error deleting visit:", error);
      setError("Failed to delete visit");
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
      header: "Visit Date",
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
      header: "Next Visit",
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
        aria-label="Edit visit"
      >
        <Edit size={16} />
      </Button>
      <Button
        variant="danger"
        size="sm"
        className="p-1"
        onClick={() => handleDeleteVisit(visit)}
        aria-label="Delete visit"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Visits</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Cancel" : "Add Visit"}
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
        <Card className="mb-6" title={editing ? "Edit Visit" : "Add New Visit"}>
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
                    <option value="">Select a passion</option>
                    {passions.map((passion) => (
                      <option key={passion.id} value={passion.id}>
                        {passion.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Visit Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />

                <Input
                  label="Next Visit Date (Optional)"
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
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editing ? "Update Visit" : "Save Visit"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {visits.length > 0 ? (
          <DataTable
            columns={columns}
            data={visits}
            keyExtractor={(visit) => visit.id.toString()}
            actions={visitActions}
          />
        ) : (
          <div className="text-center py-8">
            <ClipboardCheck size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              No visits yet
            </h3>
            <p className="text-gray-400 mb-4">Record your first visit</p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Add Visit
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default VisitsPage;
