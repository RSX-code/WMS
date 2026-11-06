import { useState } from "react";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { ActiveBadge } from "../components/Badge.jsx";
import { Field, TextInput, SelectInput } from "../components/FormField.jsx";
import { getSupplier } from "../lib/helpers.js";

function Suppliers() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();
  const confirmDialog = useConfirm();
  const [editId, setEditId] = useState(undefined);
  const [form, setForm] = useState(null);

  const generateAutoCode = () => {
    if (!state.suppliers || state.suppliers.length === 0) {
      return "SUP001";
    }

    const codes = state.suppliers
      .map((s) => s.code)
      .filter((code) => code && code.startsWith("SUP"));
    
    if (codes.length === 0) return "SUP001";

    codes.sort();
    const lastCode = codes[codes.length - 1];
    
    const match = lastCode.match(/\d+/);
    if (match) {
      const nextNumber = parseInt(match[0], 10) + 1;
      const padLength = match[0].length;
      return `SUP${String(nextNumber).padStart(padLength, "0")}`;
    }

    return "SUP001";
  };

  const openForm = (id) => {
    const s = id ? getSupplier(state, id) : null;
    if (s) {
      setForm({ ...s });
    } else {
      setForm({ 
        code: generateAutoCode(), 
        name: "", 
        phone: "", 
        email: "", 
        address: "", 
        isActive: true 
      });
    }
    setEditId(id || null);
  };
  const closeForm = () => { setEditId(undefined); setForm(null); };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) { showToast(t("common.requiredCodeName"), "danger"); return; }
    // ฟิลด์ที่ไม่บังคับ (phone/email/address) ถ้าผู้ใช้เว้นว่างไว้ ให้ส่งเป็น null แทน ""
    // เพราะ backend validate รูปแบบอีเมลแม้ค่าจะเป็น string ว่าง (แต่ยอมรับ null)
    dispatch({
      type: "SAVE_SUPPLIER",
      payload: {
        ...form,
        id: editId || undefined,
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        address: form.address?.trim() || null,
        isActive: form.isActive === true || form.isActive === "true",
      },
    });
    showToast(editId ? t("suppliers.toastUpdated") : t("suppliers.toastCreated"));
    closeForm();
  };

  const handleDelete = (id) => {
    if (state.purchaseOrders.some((p) => p.supplierId === id)) {
      showToast(t("suppliers.cannotDelete"), "danger");
      return;
    }
    confirmDialog(t("suppliers.deleteTitle"), t("common.cannotUndo"), () => {
      dispatch({ type: "DELETE_SUPPLIER", id });
      showToast(t("suppliers.toastDeleted"));
    });
  };

  const columns = [
    { key: "code", label: t("suppliers.colCode"), render: (r) => <span className="font-mono font-semibold text-xs">{r.code}</span> },
    { key: "name", label: t("suppliers.colName"), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", label: t("suppliers.colPhone") },
    { key: "email", label: t("suppliers.colEmail") },
    { key: "isActive", label: t("suppliers.colStatus"), render: (r) => <ActiveBadge isActive={r.isActive} /> },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={state.suppliers}
        searchPlaceholder={t("suppliers.searchPh")}
        toolbar={<button className="btn btn-primary" onClick={() => openForm()}><i className="fa-solid fa-plus"></i> {t("suppliers.addBtn")}</button>}
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
        title={editId ? t("suppliers.editTitle") : t("suppliers.addTitle")}
        footer={<>
          <button className="btn btn-secondary" onClick={closeForm}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleSave}>{editId ? t("common.update") : t("common.create")}</button>
        </>}
      >
        {form && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("common.code")}><TextInput value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
            <Field label={t("common.name")}><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label={t("common.phone")}><TextInput value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label={t("common.email")}><TextInput value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label={t("common.address")} className="col-span-2"><TextInput value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
            <Field label={t("common.status")}><SelectInput value={String(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })} options={[{ value: "true", label: t("common.active") }, { value: "false", label: t("common.inactive") }]} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Suppliers;