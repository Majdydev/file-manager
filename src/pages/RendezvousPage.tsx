import React, { useEffect, useState } from "react";
import { getDb } from "../db";
import Card from "../components/Card";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import Select from "../components/Select";
import DataTable from "../components/DataTable";
import { Rendezvous, Passion } from "../types";
import { Plus, Trash2, Edit, Calendar, Check, X } from "lucide-react";

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const db = getDb();

      // Get all rendezvous with passion names using the new async API
      const allRendezvous = await db.query(`
        SELECT r.*, p.name as passion_name 
        FROM rendezvous r
        JOIN passions p ON r.passion_id = p.id
        ORDER BY r.date DESC
      `);

      // Get all passions for dropdown using the new async API
      const allPassions = await db.query(
        "SELECT * FROM passions ORDER BY name"
      );

      setRendezvous(allRendezvous);
      setPassions(allPassions);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data");
    }
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
      setError("Passion and date are required");
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
    if (!confirm(`Are you sure you want to delete this rendezvous?`)) {
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
      header: "Status",
      render: (rendez: Rendezvous) => {
        const statusColors = {
          pending: "bg-yellow-100 text-yellow-800",
          completed: "bg-green-100 text-green-800",
          canceled: "bg-red-100 text-red-800",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              statusColors[rendez.status as keyof typeof statusColors]
            }`}
          >
            {rendez.status}
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
        <h1 className="text-2xl font-bold text-gray-800">Rendezvous</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Cancel" : "Add Rendezvous"}
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
          title={editing ? "Edit Rendezvous" : "Add New Rendezvous"}
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
                    <option value="">Select a passion</option>
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
                    Status
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
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
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
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editing ? "Update Rendezvous" : "Save Rendezvous"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {rendezvous.length > 0 ? (
          <DataTable
            columns={columns}
            data={rendezvous}
            keyExtractor={(rendez) => rendez.id.toString()}
            actions={rendezvousActions}
          />
        ) : (
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              No rendezvous yet
            </h3>
            <p className="text-gray-400 mb-4">Schedule your first rendezvous</p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Add Rendezvous
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RendezvousPage;
