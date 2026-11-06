import { useState } from "react";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import { Field, TextInput, SelectInput } from "../components/FormField.jsx";
import { fmt } from "../lib/helpers.js";

function Settings() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();
  const confirmDialog = useConfirm();

  const [company, setCompany] = useState("WMS Pro Logistics");
  const [currency, setCurrency] = useState("USD");
  const [alerts, setAlerts] = useState("true");
  const [timezone, setTimezone] = useState("UTC");

  const counts = [
    ["Categories", state.categories.length],
    ["Products", state.products.length],
    ["Warehouses", state.warehouses.length],
    ["Locations", state.locations.length],
    ["Inventory Rows", state.inventory.length],
    ["Transactions", state.transactions.length],
    ["Suppliers", state.suppliers.length],
    ["Purchase Orders", state.purchaseOrders.length],
    ["Customers", state.customers.length],
    ["Sales Orders", state.salesOrders.length],
  ];

  const handleReset = () => {
    confirmDialog(t("settings.resetTitle"), t("settings.resetMsg"), () => {
      dispatch({ type: "RESET_DEMO" });
      showToast(t("settings.toastReset"));
    }, t("settings.resetLabel"));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card p-5">
        <div className="text-sm font-bold mb-1">{t("settings.companyInfo")}</div>
        <div className="text-xs text-slate-400 mb-4">{t("settings.companyInfoDesc")}</div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("settings.fldCompanyName")} className="col-span-2"><TextInput value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
          <Field label={t("settings.fldCurrency")}><SelectInput value={currency} onChange={(e) => setCurrency(e.target.value)} options={[{ value: "USD", label: "USD ($)" }, { value: "THB", label: "THB (฿)" }, { value: "EUR", label: "EUR (€)" }]} /></Field>
          <Field label={t("settings.fldAlerts")}><SelectInput value={alerts} onChange={(e) => setAlerts(e.target.value)} options={[{ value: "true", label: t("settings.enabled") }, { value: "false", label: t("settings.disabled") }]} /></Field>
          <Field label={t("settings.fldTimezone")} className="col-span-2"><SelectInput value={timezone} onChange={(e) => setTimezone(e.target.value)} options={[{ value: "UTC", label: "UTC" }, { value: "Asia/Bangkok", label: "Asia/Bangkok" }, { value: "America/Chicago", label: "America/Chicago" }]} /></Field>
        </div>
        <button className="btn btn-primary mt-4" onClick={() => showToast(t("settings.toastSaved"))}><i className="fa-solid fa-check"></i> {t("settings.saveBtn")}</button>
      </div>

      <div className="card p-5">
        <div className="text-sm font-bold mb-1">{t("settings.dataOverview")}</div>
        <div className="text-xs text-slate-400 mb-4">{t("settings.dataOverviewDesc")}</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {counts.map(([l, v]) => (
            <div key={l} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
              <span className="text-slate-500">{t("settings.counts." + l)}</span>
              <span className="font-bold">{fmt(v)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold mb-1">{t("settings.demoData")}</div>
          <p className="text-[11px] text-slate-400 mb-2">{t("settings.demoDataDesc")}</p>
          <button className="btn btn-danger btn-sm" onClick={handleReset}><i className="fa-solid fa-rotate-left"></i> {t("settings.resetBtn")}</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
