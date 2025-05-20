import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  FolderArchive,
  Users,
  Calendar,
  ClipboardCheck,
  LayoutDashboard,
  FolderOpen,
} from "lucide-react";

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-[#0A2463] text-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center">
            <FolderArchive className="mr-2" size={24} />
            FileManager
          </h1>
        </div>
        <nav className="mt-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center py-3 px-6 hover:bg-[#147D9E] transition-colors ${
                isActive ? "bg-[#147D9E]" : ""
              }`
            }
          >
            <LayoutDashboard className="mr-3" size={20} />
            Dashboard
          </NavLink>
          <NavLink
            to="/files"
            className={({ isActive }) =>
              `flex items-center py-3 px-6 hover:bg-[#147D9E] transition-colors ${
                isActive ? "bg-[#147D9E]" : ""
              }`
            }
          >
            <FolderArchive className="mr-3" size={20} />
            Files
          </NavLink>
          <NavLink
            to="/categories"
            className={({ isActive }) =>
              `flex items-center py-3 px-6 hover:bg-[#147D9E] transition-colors ${
                isActive ? "bg-[#147D9E]" : ""
              }`
            }
          >
            <FolderOpen className="mr-3" size={20} />
            Categories
          </NavLink>
          <NavLink
            to="/passions"
            className={({ isActive }) =>
              `flex items-center py-3 px-6 hover:bg-[#147D9E] transition-colors ${
                isActive ? "bg-[#147D9E]" : ""
              }`
            }
          >
            <Users className="mr-3" size={20} />
            Passions
          </NavLink>
          <NavLink
            to="/rendezvous"
            className={({ isActive }) =>
              `flex items-center py-3 px-6 hover:bg-[#147D9E] transition-colors ${
                isActive ? "bg-[#147D9E]" : ""
              }`
            }
          >
            <Calendar className="mr-3" size={20} />
            Rendezvous
          </NavLink>
          <NavLink
            to="/visits"
            className={({ isActive }) =>
              `flex items-center py-3 px-6 hover:bg-[#147D9E] transition-colors ${
                isActive ? "bg-[#147D9E]" : ""
              }`
            }
          >
            <ClipboardCheck className="mr-3" size={20} />
            Visits
          </NavLink>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
