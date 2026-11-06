import { useState } from "react";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { Field, TextInput } from "../components/FormField.jsx";
import { getCustomer } from "../lib/helpers.js";

function Customers() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();
  const confirmDialog = useConfirm();
  const [editId, setEditId] = useState(undefined);
  const [form, setForm] = useState(null);

  // ฟังก์ชันสำหรับเจนรหัสออโต้ (เช่น ถ้าคนล่าสุดคือ CUST002 คนต่อไปจะเป็น CUST003)
  const generateAutoCode = () => {
    if (!state.customers || state.customers.length === 0) {
      return "CUST001"; // ถ้ายุ่งไม่มีข้อมูลเลย ให้เริ่มที่รหัสนี้
    }

    // ค้นหารหัสล่าสุดโดยดูจากรายการที่มีอยู่
    const codes = state.customers
      .map((c) => c.code)
      .filter((code) => code && code.startsWith("CUST"));
    
    if (codes.length === 0) return "CUST001";

    // จัดเรียงและดึงรหัสที่มากที่สุดออกมา
    codes.sort();
    const lastCode = codes[codes.length - 1];
    
    // ดึงเฉพาะตัวเลขด้านหลังออกมาบวกเพิ่มขึ้น 1
    const match = lastCode.match(/\d+/);
    if (match) {
      const nextNumber = parseInt(match[0], 10) + 1;
      const padLength = match[0].length; // รักษาระดับความยาวศูนย์ข้างหน้าไว้ เช่น 001
      return `CUST${String(nextNumber).padStart(padLength, "0")}`;
    }

    return "CUST001";
  };

  const openForm = (id) => {
    const c = id ? getCustomer(state, id) : null;
    
    if (c) {
      // กรณีแก้ไขข้อมูล: ใช้ข้อมูลเดิม
      setForm({ ...c });
    } else {
      // กรณีเพิ่มใหม่: ให้ generate รหัส code รันต่อออโต้มาให้เลย
      setForm({ 
        code: generateAutoCode(), 
        name: "", 
        phone: "", 
        email: "", 
        address: "" 
      });
    }
    setEditId(id || null);
  };
  const closeForm = () => { setEditId(undefined); setForm(null); };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) { showToast(t("common.requiredCodeName"), "danger"); return; }
    
    // ส่งข้อมูลไปบันทึก (หมายเหตุ: id ส่งเป็น undefined ไปถ้าเป็นเคสเพิ่มใหม่ เพื่อให้หลังบ้าน/DB ไปเจน id แท้จริงเอง)
    // ฟิลด์ที่ไม่บังคับ (phone/email/address) ถ้าผู้ใช้เว้นว่างไว้ ให้ส่งเป็น null แทน ""
    // เพราะ backend validate รูปแบบอีเมลแม้ค่าจะเป็น string ว่าง (แต่ยอมรับ null)
    dispatch({
      type: "SAVE_CUSTOMER",
      payload: {
        ...form,
        id: editId || undefined,
        phone: form.phone?.trim() || null,
        email: form.email?.trim() || null,
        address: form.address?.trim() || null,
      },
    });
    showToast(editId ? t("customers.toastUpdated") : t("customers.toastCreated"));
    closeForm();
  };

  const handleDelete = (id) => {
    if (state.salesOrders.some((s) => s.customerId === id)) {
      showToast(t("customers.cannotDelete"), "danger");
      return;
    }
    confirmDialog(t("customers.deleteTitle"), t("common.cannotUndo"), () => {
      dispatch({ type: "DELETE_CUSTOMER", id });
      showToast(t("customers.toastDeleted"));
    });
  };

  const columns = [
    { key: "code", label: t("customers.colCode"), render: (r) => <span className="font-mono font-semibold text-xs">{r.code}</span> },
    { key: "name", label: t("customers.colName"), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "phone", label: t("customers.colPhone") },
    { key: "email", label: t("customers.colEmail") },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={state.customers}
        searchPlaceholder={t("customers.searchPh")}
        toolbar={<button className="btn btn-primary" onClick={() => openForm()}><i className="fa-solid fa-plus"></i> {t("customers.addBtn")}</button>}
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
        title={editId ? t("customers.editTitle") : t("customers.addTitle")}
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
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Customers;