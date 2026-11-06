import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import DataTable from "../components/DataTable.jsx";
import { TxnTypeBadge } from "../components/Badge.jsx";
import { getProduct, locationLabel } from "../lib/helpers.js";

function Transactions() {
  const { state } = useStore();
  const { t } = useLang();

  const rows = [...state.transactions].reverse();

  const columns = [
    { key: "type", label: t("transactions.colType"), render: (r) => <TxnTypeBadge type={r.type} /> },
    { key: "productId", label: t("transactions.colProduct"), searchValue: (r) => getProduct(state, r.productId)?.name, render: (r) => getProduct(state, r.productId)?.name || "—" },
    { key: "from", label: t("transactions.colFrom"), sortable: false, render: (r) => (r.fromLocationId ? locationLabel(state, r.fromLocationId) : "—") },
    { key: "to", label: t("transactions.colTo"), sortable: false, render: (r) => (r.toLocationId ? locationLabel(state, r.toLocationId) : "—") },
    { key: "quantity", label: t("transactions.colQty"), render: (r) => <span className={`font-semibold ${r.type === "ISSUE" ? "text-red-600" : "text-emerald-600"}`}>{r.type === "ISSUE" ? "-" : "+"}{r.quantity}</span> },
    { key: "referenceType", label: t("transactions.colReference"), sortable: false, render: (r) => `${r.referenceType || "—"}${r.referenceId ? " #" + r.referenceId : ""}` },
    { key: "createdAt", label: t("transactions.colDate") },
  ];

  return (
    <div>
      <DataTable columns={columns} data={rows} searchPlaceholder={t("transactions.searchPh")} pageSize={10} filters={[{ key: "type", label: t("common.allTypes"), options: ["RECEIVE", "ISSUE", "TRANSFER", "ADJUST"].map((s) => ({ value: s, label: t("badge.txn." + s) })) }]} />
    </div>
  );
}

export default Transactions;
