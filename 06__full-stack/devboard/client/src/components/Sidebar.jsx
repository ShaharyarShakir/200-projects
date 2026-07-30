import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  AlertCircle,
  Settings,
  Sparkles
} from "lucide-react";

const menu = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", path: "/projects", icon: FolderKanban },
  { name: "Tasks", path: "/tasks", icon: CheckSquare },
  { name: "Issues", path: "/issues", icon: AlertCircle },
  { name: "Settings", path: "/settings", icon: Settings }
];

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-slate-100 p-5 flex flex-col border-r border-slate-800 shadow-xl">
      <div className="flex items-center gap-3 mb-8 px-2">
        <Sparkles className="w-8 h-8 text-indigo-400" />
        <h1 className="text-2xl font-bold tracking-tight text-white">DevBoard</h1>
      </div>

      <nav className="space-y-1.5 flex-1">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${isActive
                  ? "bg-indigo-650 text-white shadow-md shadow-indigo-900/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>


    </aside>
  );
}
