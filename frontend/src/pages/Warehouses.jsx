import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { ActiveBadge } from "../components/Badge.jsx";
import { Field, TextInput, SelectInput } from "../components/FormField.jsx";
import { getWarehouse, fmt } from "../lib/helpers.js";

function Warehouses() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();
  const confirmDialog = useConfirm();
  const navigate = useNavigate();
  const [editId, setEditId] = useState(undefined);
  const [form, setForm] = useState(null);

  const openForm = (id) => {
    const w = id ? getWarehouse(state, id) : null;
    setForm(w ? { ...w } : { code: "", name: "", address: "", isActive: true });
    setEditId(id || null);
  };
  const closeForm = () => { setEditId(undefined); setForm(null); };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) { showToast(t("common.requiredCodeName"), "danger"); return; }
    dispatch({ type: "SAVE_WAREHOUSE", payload: { ...form, id: editId || undefined, isActive: form.isActive === true || form.isActive === "true" } });
    showToast(editId ? t("warehouses.toastUpdated") : t("warehouses.toastCreated"));
    closeForm();
  };

  const handleDelete = (id) => {
    if (state.locations.some((l) => l.warehouseId === id)) {
      showToast(t("warehouses.cannotDelete"), "danger");
      return;
    }
    confirmDialog(t("warehouses.deleteTitle"), t("common.cannotUndo"), () => {
      dispatch({ type: "DELETE_WAREHOUSE", id });
      showToast(t("warehouses.toastDeleted"));
    });
  };

  const columns = [
    { key: "code", label: t("warehouses.colCode"), render: (r) => <span className="font-mono font-semibold text-xs">{r.code}</span> },
    { key: "name", label: t("warehouses.colName"), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "address", label: t("warehouses.colAddress"), render: (r) => <span className="text-slate-500">{r.address}</span> },
    { key: "locations", label: t("warehouses.colLocations"), sortable: false, render: (r) => state.locations.filter((l) => l.warehouseId === r.id).length },
    { key: "stock", label: t("warehouses.colTotalStock"), sortable: false, render: (r) => fmt(state.inventory.filter((i) => state.locations.find((l) => l.id === i.locationId)?.warehouseId === r.id).reduce((s, i) => s + i.quantity, 0)) },
    { key: "isActive", label: t("warehouses.colStatus"), render: (r) => <ActiveBadge isActive={r.isActive} /> },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={state.warehouses}
        searchPlaceholder={t("warehouses.searchPh")}
        toolbar={<button className="btn btn-primary" onClick={() => openForm()}><i className="fa-solid fa-plus"></i> {t("warehouses.addBtn")}</button>}
        rowActions={(r) => (
          <>
            <button className="btn btn-secondary btn-sm btn-icon" title={t("warehouses.viewLocTitle")} onClick={() => navigate("/locations")}><i className="fa-solid fa-location-dot text-[10px]"></i></button>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openForm(r.id)}><i className="fa-solid fa-pen text-[10px]"></i></button>
            <button className="btn btn-secondary btn-sm btn-icon text-red-600" onClick={() => handleDelete(r.id)}><i className="fa-solid fa-trash text-[10px]"></i></button>
          </>
        )}
      />

      <Modal
        open={editId !== undefined}
        onClose={closeForm}
        title={editId ? t("warehouses.editTitle") : t("warehouses.addTitle")}
        footer={<>
          <button className="btn btn-secondary" onClick={closeForm}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleSave}>{editId ? t("common.update") : t("common.create")}</button>
        </>}
      >
        {form && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.code")}><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label={t("common.name")}><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label={t("common.address")} className="col-span-2"><TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label={t("common.status")}><SelectInput value={String(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })} options={[{ value: "true", label: t("common.active") }, { value: "false", label: t("common.inactive") }]} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Warehouses;
