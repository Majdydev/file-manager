import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDatabase } from "./db";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import FilesPage from "./pages/FilesPage";
import CategoriesPage from "./pages/CategoriesPage";
import PassionsPage from "./pages/PassionsPage";
import RendezvousPage from "./pages/RendezvousPage";
import VisitsPage from "./pages/VisitsPage";
import NotificationContainer from "./components/NotificationContainer";

function App() {
  const { db, loading, error } = useDatabase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#0A2463] border-b-[#0A2463] border-l-transparent border-r-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">
            Initialisation de la base de données...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur</h2>
          <p className="text-gray-700 mb-4">
            Échec de l'initialisation de la base de données:
          </p>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {error.message}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="files" element={<FilesPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="passions" element={<PassionsPage />} />
          <Route path="rendezvous" element={<RendezvousPage />} />
          <Route path="visits" element={<VisitsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <NotificationContainer />
    </BrowserRouter>
  );
}

export default App;
