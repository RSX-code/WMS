import { useState } from "react";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { ActiveBadge } from "../components/Badge.jsx";
import { Field, TextInput, SelectInput } from "../components/FormField.jsx";
import { getCategory, fmt } from "../lib/helpers.js";

function Categories() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();
  const confirmDialog = useConfirm();
  const [editId, setEditId] = useState(undefined);
  const [form, setForm] = useState(null);

  const openForm = (id) => {
    const c = id ? getCategory(state, id) : null;
    setForm(c ? { ...c } : { name: "", description: "", isActive: true });
    setEditId(id || null);
  };
  const closeForm = () => { setEditId(undefined); setForm(null); };

  const handleSave = () => {
    if (!form.name.trim()) { showToast(t("common.requiredNameOnly"), "danger"); return; }
    dispatch({ type: "SAVE_CATEGORY", payload: { ...form, id: editId || undefined, isActive: form.isActive === true || form.isActive === "true" } });
    showToast(editId ? t("categories.toastUpdated") : t("categories.toastCreated"));
    closeForm();
  };

  const handleDelete = (id) => {
    if (state.products.some((p) => p.categoryId === id)) {
      showToast(t("categories.cannotDelete"), "danger");
      return;
    }
    confirmDialog(t("categories.deleteTitle"), t("common.cannotUndo"), () => {
      dispatch({ type: "DELETE_CATEGORY", id });
      showToast(t("categories.toastDeleted"));
    });
  };

  const columns = [
    { key: "name", label: t("categories.colCategory"), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "description", label: t("categories.colDesc"), render: (r) => <span className="text-slate-500">{r.description || "—"}</span> },
    { key: "products", label: t("categories.colProducts"), sortable: false, render: (r) => state.products.filter((p) => p.categoryId === r.id).length },
    { key: "stock", label: t("categories.colTotalStock"), sortable: false, render: (r) => fmt(state.inventory.filter((i) => state.products.find((p) => p.id === i.productId)?.categoryId === r.id).reduce((s, i) => s + i.quantity, 0)) },
    { key: "isActive", label: t("categories.colStatus"), render: (r) => <ActiveBadge isActive={r.isActive} /> },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={state.categories}
        searchPlaceholder={t("categories.searchPh")}
        toolbar={<button className="btn btn-primary" onClick={() => openForm()}><i className="fa-solid fa-plus"></i> {t("categories.addBtn")}</button>}
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
        title={editId ? t("categories.editTitle") : t("categories.addTitle")}
        footer={<>
          <button className="btn btn-secondary" onClick={closeForm}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleSave}>{editId ? t("common.update") : t("common.create")}</button>
        </>}
      >
        {form && (
          <div className="space-y-3">
            <Field label={t("common.name")}><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label={t("common.description")}><TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label={t("common.status")}><SelectInput value={String(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })} options={[{ value: "true", label: t("common.active") }, { value: "false", label: t("common.inactive") }]} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Categories;
