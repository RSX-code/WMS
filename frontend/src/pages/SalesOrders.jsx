import { useEffect, useState } from "react";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { SoStatusBadge } from "../components/Badge.jsx";
import { Field, SelectInput, DateInput, NumInput } from "../components/FormField.jsx";
import BarcodeInput from "../components/BarcodeInput.jsx";
import { byId, getCustomer, soItemsFor, soTotal, fmtc, getProduct } from "../lib/helpers.js";

function SalesOrders() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();
  const confirmDialog = useConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ customerId: "", orderDate: "" });
  const [lines, setLines] = useState([{ productId: "", quantity: 1, price: 0 }]);
  const [barcode, setBarcode] = useState("");
  const [viewId, setViewId] = useState(null);

  const viewingSO = viewId ? byId(state.salesOrders, viewId) : null;

  const columns = [
    { key: "orderNumber", label: t("so.colOrder"), render: (r) => <span className="font-mono font-semibold">{r.orderNumber}</span> },
    { key: "customerId", label: t("so.colCustomer"), searchValue: (r) => getCustomer(state, r.customerId)?.name, render: (r) => getCustomer(state, r.customerId)?.name || "—" },
    { key: "orderDate", label: t("so.colOrderDate") },
    { key: "items", label: t("so.colItems"), sortable: false, render: (r) => soItemsFor(state, r.id).length },
    { key: "total", label: t("so.colTotalAmount"), sortable: false, render: (r) => <span className="font-semibold">{fmtc(soTotal(state, r.id))}</span> },
    { key: "status", label: t("so.colStatus"), render: (r) => <SoStatusBadge status={r.status} /> },
  ];

  const openCreate = () => {
    setCreateForm({ customerId: state.customers[0]?.id || "", orderDate: new Date().toISOString().slice(0, 10) });
    setLines([{ productId: state.products[0]?.id || "", quantity: 1, price: state.products[0]?.sellingPrice ?? 0 }]);
    setBarcode("");
    setCreateOpen(true);
  };

  const addLine = () => setLines((li) => [...li, { productId: state.products[0]?.id || "", quantity: 1, price: state.products[0]?.sellingPrice ?? 0 }]);
  const removeLine = (idx) => setLines((li) => li.filter((_, i) => i !== idx));
  const updateLine = (idx, patch) => setLines((li) => li.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  const lineTotal = lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.price || 0), 0);

  const scanProduct = (code) => {
    const product = state.products.find((p) => p.isActive && String(p.barcode ?? "").trim() === String(code).trim());
    if (!product) {
      showToast(t("so.barcodeNotFound"), "danger");
      setBarcode("");
      return;
    }
    const existingIndex = lines.findIndex((l) => String(l.productId) === String(product.id));
    if (existingIndex >= 0) {
      updateLine(existingIndex, { quantity: Number(lines[existingIndex].quantity || 0) + 1, price: product.sellingPrice });
    } else {
      setLines((li) => [...li, { productId: product.id, quantity: 1, price: product.sellingPrice }]);
    }
    setBarcode("");
    showToast(t("so.barcodeAdded"));
  };

  const handleReceive = () => {
    if (!receiveLocationId) { showToast(t("po.selectLocation"), "danger"); return; }
    // ใช้ค่าเดียวกับที่ช่องกรอกโชว์: ถ้าไม่ได้พิมพ์เอง ให้ใช้จำนวนที่เหลือ (rem) เป็นค่า default
    const receipts = Object.fromEntries(
      poItemsFor(state, viewId)
        .filter((it) => it.receivedQuantity < it.quantity)
        .map((it) => {
          const rem = it.quantity - it.receivedQuantity;
          const qty = Math.min(Number(receiveQtys[it.id] ?? rem) || 0, rem);
          return [it.id, qty];
        })
    );
    if (Object.values(receipts).every((v) => v <= 0)) { showToast(t("po.enterQtyToReceive"), "danger"); return; }
    dispatch({ type: "RECEIVE_PO_ITEMS", payload: { poId: viewId, locationId: receiveLocationId, receipts } });
    showToast(t("po.toastReceived"));
    setReceiveOpen(false);
  };

  const confirmOrder = (id) => { dispatch({ type: "CONFIRM_SO", id }); showToast(t("so.toastConfirmed")); };
  const cancelOrder = (id) => confirmDialog(t("so.cancelTitle"), t("so.cancelMsg"), () => { dispatch({ type: "CANCEL_SO", id }); showToast(t("so.toastCancelled")); }, t("so.cancelOrder"));
  const remove = (id) => confirmDialog(t("so.deleteTitle"), t("so.deleteMsg"), () => { dispatch({ type: "DELETE_SO", id }); showToast(t("so.toastDeleted")); setViewId(null); });

  const [pendingFulfillId, setPendingFulfillId] = useState(null);

  const fulfill = (id) => {
    dispatch({ type: "FULFILL_SO", id });
    setPendingFulfillId(id);
    setViewId(null);
  };

  useEffect(() => {
    if (pendingFulfillId === null) return;
    const shortages = state._lastShortages || [];
    if (shortages.length) {
      const names = shortages.map((pid) => getProduct(state, pid)?.name).filter(Boolean).join(", ");
      showToast(t("so.shippedShortages", { list: names }), "danger");
    } else {
      showToast(t("so.toastFulfilled"));
    }
    setPendingFulfillId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.salesOrders]);

  return (
    <div>
      <DataTable
        columns={columns}
        data={state.salesOrders}
        searchPlaceholder={t("so.searchPh")}
        filters={[{ key: "status", label: t("common.allStatus"), options: ["DRAFT", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => ({ value: s, label: t("badge.so." + s) })) }]}
        toolbar={<button className="btn btn-primary" onClick={openCreate}><i className="fa-solid fa-plus"></i> {t("so.createBtn")}</button>}
        rowActions={(r) => <button className="btn btn-secondary btn-sm btn-icon" title={t("common.view")} onClick={() => setViewId(r.id)}><i className="fa-solid fa-eye text-[10px]"></i></button>}
      />

      {/* Create modal */}
      <Modal
        open={createOpen} onClose={() => setCreateOpen(false)} title={t("so.createTitle")} size="max-w-2xl"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleCreate}>{t("so.createOrder")}</button>
        </>}
      >
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label={t("so.fldCustomer")}><SelectInput value={createForm.customerId} onChange={(e) => setCreateForm({ ...createForm, customerId: e.target.value })} options={state.customers.map((c) => ({ value: c.id, label: c.name }))} /></Field>
          <Field label={t("so.fldOrderDate")}><DateInput value={createForm.orderDate} onChange={(e) => setCreateForm({ ...createForm, orderDate: e.target.value })} /></Field>
        </div>
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
          <Field label={t("so.barcodeScan")}>
            <BarcodeInput value={barcode} onChange={setBarcode} onScan={scanProduct} placeholder={t("so.barcodeHint")} />
          </Field>
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t("so.lineItems")}</div>
        {lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center mb-2 line-item-row">
            <div className="col-span-6"><SelectInput value={line.productId} onChange={(e) => { const selected = state.products.find((p) => String(p.id) === String(e.target.value)); updateLine(idx, { productId: e.target.value, price: selected?.sellingPrice ?? 0 }); }} options={state.products.filter((p) => p.isActive).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))} /></div>
            <div className="col-span-2"><NumInput value={line.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} /></div>
            <div className="col-span-3"><NumInput step="0.01" value={line.price} readOnly title="Selling price comes from the product" /></div>
            <div className="col-span-1"><button type="button" className="btn-ghost btn-icon rounded" onClick={() => removeLine(idx)}><i className="fa-solid fa-xmark text-red-500"></i></button></div>
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={addLine}><i className="fa-solid fa-plus"></i> {t("so.addLine")}</button>
        <div className="text-right text-sm font-bold mt-3">{t("so.totalLabel")} {fmtc(lineTotal)}</div>
      </Modal>

      {/* View modal */}
      <Modal
        open={!!viewingSO} onClose={() => setViewId(null)} title={viewingSO ? `${t("so.viewTitlePrefix")} ${viewingSO.orderNumber}` : ""} size="max-w-2xl"
        footer={viewingSO && (
          <>
            <button className="btn btn-secondary" onClick={() => setViewId(null)}>{t("common.close")}</button>
            {viewingSO.status === "DRAFT" && <button className="btn btn-secondary text-red-600" onClick={() => remove(viewingSO.id)}>{t("common.delete")}</button>}
            {viewingSO.status === "DRAFT" && <button className="btn btn-primary" onClick={() => confirmOrder(viewingSO.id)}>{t("so.confirmOrder")}</button>}
            {(viewingSO.status === "DRAFT" || viewingSO.status === "CONFIRMED") && <button className="btn btn-danger" onClick={() => cancelOrder(viewingSO.id)}>{t("so.cancelOrder")}</button>}
            {viewingSO.status === "CONFIRMED" && <button className="btn btn-success" onClick={() => fulfill(viewingSO.id)}>{t("so.fulfillShip")}</button>}
          </>
        )}
      >
        {viewingSO && (
          <>
            <div className="grid grid-cols-3 gap-3 text-xs mb-4">
              <div><span className="text-slate-400">{t("so.colCustomer")}</span><div className="font-medium mt-0.5">{getCustomer(state, viewingSO.customerId)?.name}</div></div>
              <div><span className="text-slate-400">{t("so.colOrderDate")}</span><div className="mt-0.5">{viewingSO.orderDate}</div></div>
              <div><span className="text-slate-400">{t("so.colStatus")}</span><div className="mt-0.5"><SoStatusBadge status={viewingSO.status} /></div></div>
              <div className="col-span-3"><span className="text-slate-400">{t("so.colTotalAmount")}</span><div className="mt-0.5 font-bold">{fmtc(soTotal(state, viewingSO.id))}</div></div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>{t("so.colProduct")}</th><th>{t("so.colQty")}</th><th>{t("so.colUnitPrice")}</th><th>{t("so.colLineTotal")}</th></tr></thead>
                <tbody>
                  {soItemsFor(state, viewingSO.id).map((it) => {
                    const p = getProduct(state, it.productId);
                    return (
                      <tr key={it.id}>
                        <td>{p?.name}</td>
                        <td>{it.quantity}</td>
                        <td>{fmtc(it.unitPrice)}</td>
                        <td className="font-semibold">{fmtc(it.quantity * it.unitPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default SalesOrders;