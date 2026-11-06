import { useState } from "react";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import { useConfirm } from "../components/ConfirmDialog.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { PoStatusBadge } from "../components/Badge.jsx";
import { Field, SelectInput, DateInput, NumInput } from "../components/FormField.jsx";
import BarcodeInput from "../components/BarcodeInput.jsx";
import { byId, getSupplier, poItemsFor, poTotal, fmtc, locationOptions } from "../lib/helpers.js";

function PurchaseOrders() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();
  const confirmDialog = useConfirm();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ supplierId: "", orderDate: "", expectedDate: "" });
  const [lines, setLines] = useState([{ productId: "", quantity: 1, price: 0 }]);
  const [barcode, setBarcode] = useState("");

  const [viewId, setViewId] = useState(null);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveLocationId, setReceiveLocationId] = useState("");
  const [receiveQtys, setReceiveQtys] = useState({});
  const [receiveBarcode, setReceiveBarcode] = useState("");

  const viewingPO = viewId ? byId(state.purchaseOrders, viewId) : null;

  const columns = [
    { key: "poNumber", label: t("po.colPoNumber"), render: (r) => <span className="font-mono font-semibold">{r.poNumber}</span> },
    { key: "supplierId", label: t("po.colSupplier"), searchValue: (r) => getSupplier(state, r.supplierId)?.name, render: (r) => getSupplier(state, r.supplierId)?.name || "—" },
    { key: "orderDate", label: t("po.colOrderDate"), render: (r) => r.orderDate?.slice(0, 10) || "—" },
    { key: "expectedDate", label: t("po.colExpected"), render: (r) => r.expectedDate?.slice(0, 10) || "—" },
    { key: "items", label: t("po.colItems"), sortable: false, render: (r) => poItemsFor(state, r.id).length },
    { key: "total", label: t("po.colTotalCost"), sortable: false, render: (r) => <span className="font-semibold">{fmtc(poTotal(state, r.id))}</span> },
    { key: "status", label: t("po.colStatus"), render: (r) => <PoStatusBadge status={r.status} /> },
  ];

  const openCreate = () => {
    setCreateForm({ supplierId: state.suppliers.filter((s) => s.isActive)[0]?.id || "", orderDate: new Date().toISOString().slice(0, 10), expectedDate: "" });
    setLines([{ productId: state.products[0]?.id || "", quantity: 1, price: state.products[0]?.costPrice ?? 0 }]);
    setBarcode("");
    setCreateOpen(true);
  };

  const addLine = () => setLines((li) => [...li, { productId: state.products[0]?.id || "", quantity: 1, price: state.products[0]?.costPrice ?? 0 }]);
  const removeLine = (idx) => setLines((li) => li.filter((_, i) => i !== idx));
  const updateLine = (idx, patch) => setLines((li) => li.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  const lineTotal = lines.reduce((s, l) => s + Number(l.quantity || 0) * Number(l.price || 0), 0);

  const scanProduct = (code) => {
    const product = state.products.find((p) => p.isActive && String(p.barcode ?? "").trim() === String(code).trim());
    if (!product) {
      showToast(t("po.barcodeNotFound"), "danger");
      setBarcode("");
      return;
    }
    const existingIndex = lines.findIndex((l) => String(l.productId) === String(product.id));
    if (existingIndex >= 0) {
      updateLine(existingIndex, { quantity: Number(lines[existingIndex].quantity || 0) + 1, price: product.costPrice });
    } else {
      setLines((li) => [...li, { productId: product.id, quantity: 1, price: product.costPrice }]);
    }
    setBarcode("");
    showToast(t("po.barcodeAdded"));
  };

  const handleCreate = () => {
    const items = lines.filter((l) => l.productId && Number(l.quantity) > 0).map((l) => ({ productId: l.productId, quantity: Number(l.quantity), price: Number(l.price) }));
    if (!createForm.supplierId || items.length === 0) {
      showToast(t("po.selectSupplierItem"), "danger");
      return;
    }
    dispatch({ type: "CREATE_PO", payload: { supplierId: createForm.supplierId, orderDate: createForm.orderDate, expectedDate: createForm.expectedDate || null, items } });
    showToast(t("po.toastCreated"));
    setCreateOpen(false);
  };

  const markOrdered = (id) => { dispatch({ type: "MARK_PO_ORDERED", id }); showToast(t("po.toastMarkedOrdered")); };
  const cancel = (id) => confirmDialog(t("po.cancelTitle"), t("po.cancelMsg"), () => { dispatch({ type: "CANCEL_PO", id }); showToast(t("po.toastCancelled")); }, t("po.cancelPO"));
  const remove = (id) => confirmDialog(t("po.deleteTitle"), t("po.deleteMsg"), () => { dispatch({ type: "DELETE_PO", id }); showToast(t("po.toastDeleted")); setViewId(null); });

  const openReceive = () => {
    setReceiveQtys({});
    setReceiveLocationId("");
    setReceiveBarcode("");
    setReceiveOpen(true);
  };

  const handleReceive = () => {
    if (!receiveLocationId) { showToast(t("po.selectLocation"), "danger"); return; }
    const receipts = Object.fromEntries(Object.entries(receiveQtys).map(([k, v]) => [k, Number(v) || 0]));
    if (Object.values(receipts).every((v) => v <= 0)) { showToast(t("po.enterQtyToReceive"), "danger"); return; }
    dispatch({ type: "RECEIVE_PO_ITEMS", payload: { poId: viewId, locationId: receiveLocationId, receipts } });
    showToast(t("po.toastReceived"));
    setReceiveOpen(false);
  };

  return (
    <div>
      <DataTable
        columns={columns}
        data={state.purchaseOrders}
        searchPlaceholder={t("po.searchPh")}
        filters={[{ key: "status", label: t("common.allStatus"), options: ["DRAFT", "ORDERED", "RECEIVED", "CANCELLED"].map((s) => ({ value: s, label: t("badge.po." + s) })) }]}
        toolbar={<button className="btn btn-primary" onClick={openCreate}><i className="fa-solid fa-plus"></i> {t("po.createBtn")}</button>}
        rowActions={(r) => <button className="btn btn-secondary btn-sm btn-icon" title={t("common.view")} onClick={() => setViewId(r.id)}><i className="fa-solid fa-eye text-[10px]"></i></button>}
      />

      {/* Create modal */}
      <Modal
        open={createOpen} onClose={() => setCreateOpen(false)} title={t("po.createTitle")} size="max-w-2xl"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleCreate}>{t("po.createPO")}</button>
        </>}
      >
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Field label={t("po.fldSupplier")}><SelectInput value={createForm.supplierId} onChange={(e) => setCreateForm({ ...createForm, supplierId: e.target.value })} options={state.suppliers.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name }))} /></Field>
          <Field label={t("po.fldOrderDate")}><DateInput value={createForm.orderDate} onChange={(e) => setCreateForm({ ...createForm, orderDate: e.target.value })} /></Field>
          <Field label={t("po.fldExpectedDate")} className="col-span-2"><DateInput value={createForm.expectedDate} onChange={(e) => setCreateForm({ ...createForm, expectedDate: e.target.value })} /></Field>
        </div>
        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
          <Field label={t("po.barcodeScan")}>
            <BarcodeInput value={barcode} onChange={setBarcode} onScan={scanProduct} placeholder={t("po.barcodeHint")} />
          </Field>
        </div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t("po.lineItems")}</div>
        {lines.map((line, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center mb-2 line-item-row">
            <div className="col-span-6"><SelectInput value={line.productId} onChange={(e) => { const selected = state.products.find((p) => String(p.id) === String(e.target.value)); updateLine(idx, { productId: e.target.value, price: selected?.costPrice ?? 0 }); }} options={state.products.filter((p) => p.isActive).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))} /></div>
            <div className="col-span-2"><NumInput value={line.quantity} onChange={(e) => updateLine(idx, { quantity: e.target.value })} /></div>
            <div className="col-span-3"><NumInput step="0.01" value={line.price} readOnly title="Cost price comes from the product" /></div>
            <div className="col-span-1"><button type="button" className="btn-ghost btn-icon rounded" onClick={() => removeLine(idx)}><i className="fa-solid fa-xmark text-red-500"></i></button></div>
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm mt-2" onClick={addLine}><i className="fa-solid fa-plus"></i> {t("po.addLine")}</button>
        <div className="text-right text-sm font-bold mt-3">{t("po.totalLabel")} {fmtc(lineTotal)}</div>
      </Modal>

      {/* View modal */}
      <Modal
        open={!!viewingPO} onClose={() => setViewId(null)} title={viewingPO ? `${t("po.viewTitlePrefix")} ${viewingPO.poNumber}` : ""} size="max-w-2xl"
        footer={viewingPO && (
          <>
            <button className="btn btn-secondary" onClick={() => setViewId(null)}>{t("common.close")}</button>
            {viewingPO.status === "DRAFT" && <button className="btn btn-secondary text-red-600" onClick={() => remove(viewingPO.id)}>{t("common.delete")}</button>}
            {viewingPO.status === "DRAFT" && <button className="btn btn-primary" onClick={() => markOrdered(viewingPO.id)}>{t("po.markOrdered")}</button>}
            {(viewingPO.status === "DRAFT" || viewingPO.status === "ORDERED") && <button className="btn btn-danger" onClick={() => cancel(viewingPO.id)}>{t("po.cancelPO")}</button>}
            {viewingPO.status === "ORDERED" && <button className="btn btn-success" onClick={openReceive}>{t("po.receiveItems")}</button>}
          </>
        )}
      >
        {viewingPO && (
          <>
            <div className="grid grid-cols-3 gap-3 text-xs mb-4">
              <div><span className="text-slate-400">{t("po.colSupplier")}</span><div className="font-medium mt-0.5">{getSupplier(state, viewingPO.supplierId)?.name}</div></div>
              <div><span className="text-slate-400">{t("po.colOrderDate")}</span><div className="mt-0.5">{viewingPO.orderDate?.slice(0, 10)}</div></div>
              <div><span className="text-slate-400">{t("po.colExpected")}</span><div className="mt-0.5">{viewingPO.expectedDate?.slice(0, 10) || "—"}</div></div>
              <div><span className="text-slate-400">{t("po.colStatus")}</span><div className="mt-0.5"><PoStatusBadge status={viewingPO.status} /></div></div>
              <div className="col-span-2"><span className="text-slate-400">{t("po.colTotalCost")}</span><div className="mt-0.5 font-bold">{fmtc(poTotal(state, viewingPO.id))}</div></div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>{t("po.colProduct")}</th><th>{t("po.colQty")}</th><th>{t("po.colUnitCost")}</th><th>{t("po.colReceived")}</th><th>{t("po.colRemaining")}</th></tr></thead>
                <tbody>
                  {poItemsFor(state, viewingPO.id).map((it) => {
                    const p = state.products.find((pp) => pp.id === it.productId);
                    return (
                      <tr key={it.id}>
                        <td>{p?.name}</td>
                        <td>{it.quantity}</td>
                        <td>{fmtc(it.unitCost)}</td>
                        <td>{it.receivedQuantity}</td>
                        <td className="font-semibold">{it.quantity - it.receivedQuantity}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Modal>

      {/* Receive modal */}
      <Modal
        open={receiveOpen} onClose={() => setReceiveOpen(false)} title={viewingPO ? `${t("po.receiveTitlePrefix")} ${viewingPO.poNumber}` : ""} size="max-w-2xl"
        footer={<>
          <button className="btn btn-secondary" onClick={() => setReceiveOpen(false)}>{t("common.cancel")}</button>
          <button className="btn btn-success" onClick={handleReceive}>{t("po.confirmReceipt")}</button>
        </>}
      >
        {viewingPO && (
          <>
            <div className="mb-4"><Field label={t("po.fldReceivingLoc")}><SelectInput value={receiveLocationId} onChange={(e) => setReceiveLocationId(e.target.value)} options={[{ value: "", label: "—" }, ...locationOptions(state)]} /></Field></div>
            <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
              <Field label={t("po.barcodeScan")}>
                <BarcodeInput
                  value={receiveBarcode}
                  onChange={setReceiveBarcode}
                  onScan={(code) => {
                    const item = poItemsFor(state, viewingPO.id).find((it) => {
                      const p = state.products.find((pp) => pp.id === it.productId);
                      return p?.isActive && String(p.barcode ?? "").trim() === String(code).trim() && Number(receiveQtys[it.id] ?? 0) < (it.quantity - it.receivedQuantity);
                    });
                    if (!item) { showToast(t("po.barcodeNotFound"), "danger"); setReceiveBarcode(""); return; }
                    const remaining = item.quantity - item.receivedQuantity;
                    const next = Math.min(remaining, Number(receiveQtys[item.id] || 0) + 1);
                    setReceiveQtys((q) => ({ ...q, [item.id]: next }));
                    setReceiveBarcode("");
                    showToast(t("po.barcodeAdded"));
                  }}
                  placeholder={t("po.barcodeHint")}
                />
              </Field>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>{t("po.colProduct")}</th><th>{t("po.colRemaining")}</th><th style={{ width: 120 }}>{t("po.colReceiveNow")}</th></tr></thead>
                <tbody>
                  {poItemsFor(state, viewingPO.id).filter((it) => it.receivedQuantity < it.quantity).map((it) => {
                    const p = state.products.find((pp) => pp.id === it.productId);
                    const rem = it.quantity - it.receivedQuantity;
                    return (
                      <tr key={it.id}>
                        <td>{p?.name}</td>
                        <td>{rem}</td>
                        <td><input type="number" className="form-input" min="0" max={rem} value={receiveQtys[it.id] ?? rem} onChange={(e) => setReceiveQtys({ ...receiveQtys, [it.id]: e.target.value })} /></td>
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

export default PurchaseOrders;