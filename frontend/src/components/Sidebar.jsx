import { NavLink } from "react-router-dom";
import { NAV_SECTIONS } from "../lib/nav.js";
import { useLang } from "../i18n/LangContext.jsx";

function Sidebar({ collapsed, mobileOpen }) {
  const { t } = useLang();

  return (
    <aside
      id="sidebar"
      className={`bg-white border-r border-slate-200 flex flex-col overflow-x-hidden ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-100 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <i className="fa-solid fa-warehouse text-white text-sm"></i>
        </div>
        <span className="nav-label ml-2.5 font-bold text-sm tracking-tight whitespace-nowrap">
          WMS Pro
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((sec) => (
          <div key={sec.section}>
            <div className="side-section">{t("section." + sec.section)}</div>
            {sec.items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <i className={`fa-solid ${item.icon} nav-icon`}></i>
                <span className="nav-label whitespace-nowrap">{t("nav." + item.id)}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-100 p-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] text-slate-400 side-foot-label">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>{t("systemOnline")}</span>
        </div>
        <div className="flex items-center gap-2.5 px-2 py-2 mt-1 rounded-lg hover:bg-slate-50 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
            JD
          </div>
          <div className="min-w-0 side-foot-label">
            <div className="text-xs font-semibold truncate">John Doe</div>
            <div className="text-[10px] text-slate-400">{t("userRole")}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
