import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { ActiveBadge } from "../components/Badge.jsx";
import { Field, TextInput, NumInput, SelectInput } from "../components/FormField.jsx";
import { getCategory, getProduct, fmtc, fmt } from "../lib/helpers.js";

const UNITS = ["PCS", "BOX", "CTN", "RL", "KG", "L"];

function Products() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();
  const confirmDialog = useConfirm();
  const location = useLocation();

  const [viewId, setViewId] = useState(null);
  const [editId, setEditId] = useState(undefined); // undefined = closed, null = new, number = editing
  const [form, setForm] = useState(null);

  const viewingProduct = viewId ? getProduct(state, viewId) : null;

  const openForm = (id) => {
    const p = id ? getProduct(state, id) : null;
    setForm(p ? { ...p } : {
      sku: "", name: "", description: "", categoryId: state.categories[0]?.id,
      barcode: "", unit: "PCS", costPrice: "", sellingPrice: "", minimumStock: "", isActive: true,
    });
    setEditId(id || null);
  };

  const closeForm = () => { setEditId(undefined); setForm(null); };

  const handleSave = () => {
    if (!form.sku?.trim() || !form.name?.trim()) {
      showToast(t("common.requiredSkuName"), "danger");
      return;
    }
    const payload = {
      ...form,
      id: editId || undefined,
      categoryId: form.categoryId,
      minimumStock: Number(form.minimumStock) || 0,
      costPrice: Number(form.costPrice) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      isActive: form.isActive === true || form.isActive === "true",
    };
    dispatch({ type: "SAVE_PRODUCT", payload });
    showToast(editId ? t("products.toastUpdated") : t("products.toastCreated"));
    closeForm();
  };

  const handleDelete = (id) => {
    confirmDialog(t("products.deleteTitle"), t("products.deleteMsg"), () => {
      dispatch({ type: "DELETE_PRODUCT", id });
      showToast(t("products.toastDeleted"));
    });
  };

  const totalStockFor = (productId) =>
    state.inventory.filter((i) => i.productId === productId).reduce((s, i) => s + i.quantity, 0);

  const columns = [
    { key: "sku", label: t("products.colSku"), render: (r) => <span className="font-mono font-semibold text-xs">{r.sku}</span> },
    { key: "name", label: t("products.colProduct"), render: (r) => <span className="font-medium">{r.name}</span> },
    { key: "categoryId", label: t("products.colCategory"), searchValue: (r) => getCategory(state, r.categoryId)?.name, render: (r) => getCategory(state, r.categoryId)?.name || "—" },
    { key: "barcode", label: t("products.colBarcode"), render: (r) => <span className="font-mono text-xs text-slate-400">{r.barcode}</span> },
    { key: "unit", label: t("products.colUnit") },
    { key: "costPrice", label: t("products.colCost"), render: (r) => fmtc(r.costPrice) },
    { key: "sellingPrice", label: t("products.colSelling"), render: (r) => fmtc(r.sellingPrice) },
    { key: "minimumStock", label: t("products.colMinStock") },
    { key: "isActive", label: t("products.colStatus"), render: (r) => <ActiveBadge isActive={r.isActive} /> },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={state.products}
        searchPlaceholder={t("products.searchPh")}
        initialSearch={location.state?.initialSearch || ""}
        filters={[{ key: "categoryId", label: t("common.allCategories"), options: state.categories.map((c) => ({ value: c.id, label: c.name })) }]}
        toolbar={
          <button className="btn btn-primary" onClick={() => openForm()}>
            <i className="fa-solid fa-plus"></i> {t("products.addBtn")}
          </button>
        }
        rowActions={(r) => (
          <>
            <button className="btn btn-secondary btn-sm btn-icon" title={t("common.view")} onClick={() => setViewId(r.id)}><i className="fa-solid fa-eye text-[10px]"></i></button>
            <button className="btn btn-secondary btn-sm btn-icon" title={t("common.edit")} onClick={() => openForm(r.id)}><i className="fa-solid fa-pen text-[10px]"></i></button>
            <button className="btn btn-secondary btn-sm btn-icon text-red-600" title={t("common.delete")} onClick={() => handleDelete(r.id)}><i className="fa-solid fa-trash text-[10px]"></i></button>
          </>
        )}
      />

      {/* View modal */}
      <Modal open={!!viewingProduct} onClose={() => setViewId(null)} title={t("products.details")} footer={<button className="btn btn-secondary" onClick={() => setViewId(null)}>{t("common.close")}</button>}>
        {viewingProduct && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-slate-400">{t("products.fldSku")}</span><div className="font-mono font-semibold mt-0.5">{viewingProduct.sku}</div></div>
            <div><span className="text-slate-400">{t("products.fldName")}</span><div className="font-medium mt-0.5">{viewingProduct.name}</div></div>
            <div className="col-span-2"><span className="text-slate-400">{t("products.fldDesc")}</span><div className="mt-0.5">{viewingProduct.description || "—"}</div></div>
            <div><span className="text-slate-400">{t("products.fldCategory")}</span><div className="mt-0.5">{getCategory(state, viewingProduct.categoryId)?.name || "—"}</div></div>
            <div><span className="text-slate-400">{t("products.fldBarcode")}</span><div className="font-mono mt-0.5">{viewingProduct.barcode}</div></div>
            <div><span className="text-slate-400">{t("products.fldUnit")}</span><div className="mt-0.5">{viewingProduct.unit}</div></div>
            <div><span className="text-slate-400">{t("products.fldMinStock")}</span><div className="mt-0.5">{viewingProduct.minimumStock}</div></div>
            <div><span className="text-slate-400">{t("products.fldCost")}</span><div className="mt-0.5 font-semibold">{fmtc(viewingProduct.costPrice)}</div></div>
            <div><span className="text-slate-400">{t("products.fldSelling")}</span><div className="mt-0.5 font-semibold">{fmtc(viewingProduct.sellingPrice)}</div></div>
            <div><span className="text-slate-400">{t("products.fldTotalStock")}</span><div className="mt-0.5 font-semibold">{fmt(totalStockFor(viewingProduct.id))}</div></div>
            <div><span className="text-slate-400">{t("products.fldStatus")}</span><div className="mt-0.5"><ActiveBadge isActive={viewingProduct.isActive} /></div></div>
          </div>
        )}
      </Modal>

      {/* Add/Edit modal */}
      <Modal
        open={editId !== undefined}
        onClose={closeForm}
        title={editId ? t("products.editTitle") : t("products.addTitle")}
        size="max-w-xl"
        footer={<>
          <button className="btn btn-secondary" onClick={closeForm}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleSave}>{editId ? t("common.update") : t("common.create")}</button>
        </>}
      >
        {form && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("products.fldSku")}><TextInput value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></Field>
            <Field label={t("products.fldName2")}><TextInput value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label={t("products.fldDesc")} className="col-span-2"><TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Field label={t("products.fldCategory")}><SelectInput value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} options={state.categories.map((c) => ({ value: c.id, label: c.name }))} /></Field>
            <Field label={t("products.fldBarcode")}><TextInput value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Field>
            <Field label={t("products.fldUnit")}><SelectInput value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} options={UNITS.map((u) => ({ value: u, label: u }))} /></Field>
            <Field label={t("products.fldMinStock")}><NumInput value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} /></Field>
            <Field label={t("products.fldCost")}><NumInput step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></Field>
            <Field label={t("products.fldSelling")}><NumInput step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></Field>
            <Field label={t("products.fldStatus")}><SelectInput value={String(form.isActive)} onChange={(e) => setForm({ ...form, isActive: e.target.value === "true" })} options={[{ value: "true", label: t("common.active") }, { value: "false", label: t("common.inactive") }]} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Products;
