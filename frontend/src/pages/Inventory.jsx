import { useState } from "react";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { useToast } from "../components/Toast.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { StockBadge } from "../components/Badge.jsx";
import { Field, SelectInput, NumInput, TextInput } from "../components/FormField.jsx";
import BarcodeInput from "../components/BarcodeInput.jsx";
import { getProduct, getWarehouse, getLocation, locationLabel, locationOptions, stockAvailable, stockStatus, fmt } from "../lib/helpers.js";

function Inventory() {
  const { state, dispatch } = useStore();
  const { t } = useLang();
  const showToast = useToast();

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: "", locationId: "", direction: "increase", qty: 1, reason: "Stocktake" });
  const [transferForm, setTransferForm] = useState({ productId: "", fromId: "", toId: "", qty: 1 });
  const [adjustBarcode, setAdjustBarcode] = useState("");
  const [transferBarcode, setTransferBarcode] = useState("");

  const rows = state.inventory.map((i) => {
    const p = getProduct(state, i.productId);
    const l = getLocation(state, i.locationId);
    const w = l ? getWarehouse(state, l.warehouseId) : null;
    return {
      ...i,
      productName: p?.name, sku: p?.sku, warehouseId: w?.id, locationCode: l?.code,
      available: stockAvailable(i), status: stockStatus(i, p?.minimumStock || 0), minStock: p?.minimumStock || 0,
    };
  });

  const columns = [
    { key: "sku", label: t("inventory.colSku"), render: (r) => <span className="font-mono font-semibold text-xs">{r.sku}</span> },
    { key: "productName", label: t("inventory.colProduct") },
    { key: "locationCode", label: t("inventory.colLocation"), searchValue: (r) => r.locationCode, render: (r) => locationLabel(state, r.locationId) },
    { key: "quantity", label: t("inventory.colQty"), render: (r) => <span className="font-semibold">{fmt(r.quantity)}</span> },
    { key: "reservedQuantity", label: t("inventory.colReserved"), render: (r) => fmt(r.reservedQuantity) },
    { key: "available", label: t("inventory.colAvailable"), render: (r) => <span className="font-semibold">{fmt(r.available)}</span> },
    { key: "minStock", label: t("inventory.colMin") },
    { key: "status", label: t("inventory.colStatus"), render: (r) => <StockBadge status={r.status} /> },
  ];

  const handleAdjust = () => {
    const qty = Number(adjustForm.qty);
    if (!adjustForm.productId || !adjustForm.locationId || qty <= 0) {
      showToast(t("inventory.invalidQty"), "danger");
      return;
    }
    const existing = state.inventory.find((i) =>i.productId === adjustForm.productId &&i.locationId === adjustForm.locationId);
    if (adjustForm.direction === "decrease" && (!existing || existing.quantity < qty)) {
      showToast(t("inventory.notEnoughDecrease"), "danger");
      return;
    }
    dispatch({ type: "ADJUST_STOCK", payload: { productId: adjustForm.productId, locationId: adjustForm.locationId, dir: adjustForm.direction, qty, reason: adjustForm.reason } });
    showToast(t("inventory.toastAdjusted"));
    setAdjustOpen(false);
  };

  const handleTransfer = () => {
    const qty = Number(transferForm.qty);
    if (!transferForm.productId || !transferForm.fromId || !transferForm.toId || qty <= 0) {
      showToast(t("inventory.invalidQty"), "danger");
      return;
    }
    if (transferForm.fromId === transferForm.toId) {
      showToast(t("inventory.sameLocation"), "danger");
      return;
    }
    const fromInv = state.inventory.find((i) =>i.productId === transferForm.productId &&i.locationId === transferForm.fromId);
    if (!fromInv || fromInv.quantity < qty) {
      showToast(t("inventory.notEnoughSource"), "danger");
      return;
    }
    dispatch({ type: "TRANSFER_STOCK", payload: { productId: transferForm.productId, fromId: transferForm.fromId, toId: transferForm.toId, qty } });
    showToast(t("inventory.toastTransferred"));
    setTransferOpen(false);
  };

  const activeProducts = state.products.filter((p) => p.isActive).map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }));
  const locOpts = locationOptions(state);

  return (
    <div>
      <DataTable
        columns={columns}
        data={rows}
        searchPlaceholder={t("inventory.searchPh")}
        filters={[
          { key: "warehouseId", label: t("common.allWarehouses"), options: state.warehouses.map((w) => ({ value: w.id, label: w.name })) },
          { key: "status", label: t("common.allStatus"), options: ["In Stock", "Low Stock", "Out of Stock"].map((s) => ({ value: s, label: t("badge.stock." + s) })) },
        ]}
        toolbar={
          <>
            <button className="btn btn-secondary" onClick={() => { setAdjustForm({ productId: "", locationId: "", direction: "increase", qty: 1, reason: "Stocktake" }); setAdjustBarcode(""); setAdjustOpen(true); }}>
              <i className="fa-solid fa-sliders"></i> {t("inventory.adjustBtn")}
            </button>
            <button className="btn btn-primary" onClick={() => { setTransferForm({ productId: "", fromId: "", toId: "", qty: 1 }); setTransferBarcode(""); setTransferOpen(true); }}>
              <i className="fa-solid fa-arrow-right-arrow-left"></i> {t("inventory.transferBtn")}
            </button>
          </>
        }
      />

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title={t("inventory.adjustTitle")}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setAdjustOpen(false)}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleAdjust}>{t("common.apply")}</button>
        </>}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("inventory.barcodeScan")} className="col-span-2">
            <BarcodeInput
              value={adjustBarcode}
              onChange={setAdjustBarcode}
              onScan={(code) => {
                const product = state.products.find((p) => p.isActive && String(p.barcode ?? "").trim() === String(code).trim());
                if (!product) { showToast(t("inventory.barcodeNotFound"), "danger"); setAdjustBarcode(""); return; }
                setAdjustForm((f) => ({ ...f, productId: product.id }));
                setAdjustBarcode("");
              }}
              placeholder={t("inventory.barcodeHint")}
            />
          </Field>
          <Field label={t("inventory.fldProduct")} className="col-span-2"><SelectInput value={adjustForm.productId} onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })} options={[{ value: "", label: "—" }, ...activeProducts]} /></Field>
          <Field label={t("inventory.fldLocation")} className="col-span-2"><SelectInput value={adjustForm.locationId} onChange={(e) => setAdjustForm({ ...adjustForm, locationId: e.target.value })} options={[{ value: "", label: "—" }, ...locOpts]} /></Field>
          <Field label={t("inventory.fldDirection")}><SelectInput value={adjustForm.direction} onChange={(e) => setAdjustForm({ ...adjustForm, direction: e.target.value })} options={[{ value: "increase", label: t("inventory.dirIncrease") }, { value: "decrease", label: t("inventory.dirDecrease") }]} /></Field>
          <Field label={t("inventory.fldQty")}><NumInput value={adjustForm.qty} onChange={(e) => setAdjustForm({ ...adjustForm, qty: e.target.value })} /></Field>
          <Field label={t("inventory.fldReason")} className="col-span-2"><TextInput value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} /></Field>
        </div>
      </Modal>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title={t("inventory.transferTitle")}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setTransferOpen(false)}>{t("common.cancel")}</button>
          <button className="btn btn-primary" onClick={handleTransfer}>{t("common.transfer")}</button>
        </>}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("inventory.barcodeScan")} className="col-span-2">
            <BarcodeInput
              value={transferBarcode}
              onChange={setTransferBarcode}
              onScan={(code) => {
                const product = state.products.find((p) => p.isActive && String(p.barcode ?? "").trim() === String(code).trim());
                if (!product) { showToast(t("inventory.barcodeNotFound"), "danger"); setTransferBarcode(""); return; }
                setTransferForm((f) => ({ ...f, productId: product.id }));
                setTransferBarcode("");
              }}
              placeholder={t("inventory.barcodeHint")}
            />
          </Field>
          <Field label={t("inventory.fldProduct")} className="col-span-2"><SelectInput value={transferForm.productId} onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })} options={[{ value: "", label: "—" }, ...activeProducts]} /></Field>
          <Field label={t("inventory.fldFrom")}><SelectInput value={transferForm.fromId} onChange={(e) => setTransferForm({ ...transferForm, fromId: e.target.value })} options={[{ value: "", label: "—" }, ...locOpts]} /></Field>
          <Field label={t("inventory.fldTo")}><SelectInput value={transferForm.toId} onChange={(e) => setTransferForm({ ...transferForm, toId: e.target.value })} options={[{ value: "", label: "—" }, ...locOpts]} /></Field>
          <Field label={t("inventory.fldQty")} className="col-span-2"><NumInput value={transferForm.qty} onChange={(e) => setTransferForm({ ...transferForm, qty: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}

export default Inventory;
