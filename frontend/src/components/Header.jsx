import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "./Toast.jsx";
import { pageIdForPath } from "../lib/nav.js";

function Header({ onToggleSidebar }) {
  const { t, lang, setLang } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useToast();
  const [search, setSearch] = useState("");

  const pageId = pageIdForPath(location.pathname);
  const pageTitle = t("nav." + pageId);

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && search.trim()) {
      navigate("/products", { state: { initialSearch: search.trim() } });
    }
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 flex-shrink-0">
      <button className="btn-ghost btn-icon rounded-lg" onClick={onToggleSidebar}>
        <i className="fa-solid fa-bars"></i>
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-slate-400 leading-none mb-0.5">
          {t("brandRoot")} <i className="fa-solid fa-chevron-right text-[8px] mx-1"></i> {pageTitle}
        </div>
        <h1 className="text-[15px] font-bold leading-tight truncate">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t("searchPlaceholder")}
            className="w-64 pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
          />
        </div>

        <div className="lang-switch">
          <div className={`lang-btn ${lang === "th" ? "active" : ""}`} onClick={() => setLang("th")}>TH</div>
          <div className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => setLang("en")}>EN</div>
        </div>

        <button
          className="relative btn-ghost btn-icon rounded-lg"
          onClick={() => showToast(t("noNotifications"), "info")}
        >
          <i className="fa-regular fa-bell text-sm"></i>
          <span className="absolute top-1 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        <div className="w-px h-6 bg-slate-200 mx-1"></div>

        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          JD
        </div>
      </div>
    </header>
  );
}

export default Header;
