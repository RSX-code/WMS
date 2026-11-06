import { useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import Header from "../components/Header.jsx";

function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 900) setMobileOpen((v) => !v);
    else setCollapsed((v) => !v);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={handleToggleSidebar} />
        <main className="min-h-0 flex-1 overflow-y-auto p-5 page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
