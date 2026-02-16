import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { SimInventoryManager } from "@/components/sim/SimInventoryManager";
import { Moon, Sun, User } from "lucide-react";

const SimInventory: React.FC = () => {
  const { isAdmin } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  if (!isAdmin()) {
    return <Navigate to="/" />;
  }

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        {/* Minimal header — only dark mode + user icon */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
            {/* Tabs rendered by SimInventoryManager will sit in main */}
            <div />
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <div className="h-9 w-9 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-6 py-8">
          <SimInventoryManager />
        </main>
      </div>
    </div>
  );
};

export default SimInventory;
