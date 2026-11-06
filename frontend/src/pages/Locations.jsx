import { useState } from "react";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { ActiveBadge } from "../components/Badge.jsx";
import { Field, TextInput, SelectInput } from "../components/FormField.jsx";
import { getLocation, getWarehouse, fmt } from "../lib/helpers.js";

function Locations() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();
  const confirmDialog = useConfirm();
  const [editId, setEditId] = useState(undefined);
  const [form, setForm] = useState(null);

  const openForm = (id) => {
    const l = id ? getLocation(state, id) : null;
    setForm(l ? { ...l } : { warehouseId: state.warehouses[0]?.id, code: "", name: "", isActive: true });
    setEditId(id || null);
  };
  const closeForm = () => { setEditId(undefined); setForm(null); };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) { showToast(t("common.requiredCodeName"), "danger"); return; }
    const payload = { ...form, id: editId || undefined, warehouseId: Number(form.warehouseId), isActive: form.isActive === true || form.isActive === "true" };
    const duplicate = state.locations.some((l) => l.warehouseId === payload.warehouseId && l.code === payload.code && l.id !== editId);
    if (duplicate) { showToast(t("locations.dupCode"), "danger"); return; }
    dispatch({ type: "SAVE_LOCATION", payload });
    showToast(editId ? t("locations.toastUpdated") : t("locations.toastCreated"));
    closeForm();
  };

  const handleDelete = (id) => {
    if (state.inventory.some((i) => i.locationId === id)) {
      showToast(t("locations.cannotDelete"), "danger");
      return;
    }
    confirmDialog(t("locations.deleteTitle"), t("common.cannotUndo"), () => {
      dispatch({ type: "DELETE_LOCATION", id });
      showToast(t("locations.toastDeleted"));
    });
  };

  const columns = [
    { key: "code", label: t("locations.colCode"), render: (r) => <span className="font-mono font-semibold text-xs">{r.code}</span> },
    { key: "name", label: t("locations.colName") },
    { key: "warehouseId", label: t("locations.colWarehouse"), searchValue: (r) => getWarehouse(state, r.warehouseId)?.name, render: (r) => getWarehouse(state, r.warehouseId)?.name || "—" },
    { key: "products", label: t("locations.colProducts"), sortable: false, render: (r) => new Set(state.inventory.filter((i) => i.locationId === r.id).map((i) => i.productId)).size },
    { key: "qty", label: t("locations.colTotalQty"), sortable: false, render: (r) => fmt(state.inventory.filter((i) => i.locationId === r.id).reduce((s, i) => s + i.quantity, 0)) },
    { key: "isActive", label: t("locations.colStatus"), render: (r) => <ActiveBadge isActive={r.isActive} /> },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={state.locations}
        searchPlaceholder={t("locations.searchPh")}
        filters={[{ key: "warehouseId", label: t("common.allWarehouses"), options: state.warehouses.map((w) => ({ value: w.id, label: w.name })) }]}
        toolbar={<button className="btn btn-primary" onClick={() => openForm()}><i className="fa-solid fa-plus"></i> {t("locations.addBtn")}</button>}
        rowActions={(r) => (
          <>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openForm(r.id)}><i className="fa-solid fa-pen text-[10px]"></i></button>
            <button className="btn btn-secondary btn-sm btn-icon text-red-600" onClick={() => handleDelete(r.id)}><i className="fa-solid fa-trash text-[10px]"></i></button>
          </>
        )}
      />

      <Modal
        open={editId !== undefined}
        onClose={closeForm}
        title={editId ? t("locations.editTitle") : t("locations.addTitle")}
        footer={<>
          <button className="btn btn-secondary" onClick={closeForm}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleSave}>{editId ? t("common.update") : t("common.create")}</button>
        </>}
      >
        {form && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("locations.fldWarehouse")}><SelectInput value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} options={state.warehouses.map((w) => ({ value: w.id, label: w.name }))} /></Field>
            <Field label={t("common.code")}><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label={t("common.name")} className="col-span-2"><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label={t("common.status")}><SelectInput value={String(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })} options={[{ value: "true", label: t("common.active") }, { value: "false", label: t("common.inactive") }]} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Locations;
