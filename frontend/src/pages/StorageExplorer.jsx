import { useMemo, useState } from "react";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import { getProduct } from "../lib/helpers.js";

// ──────────────────────────────────────────────────────────────────────────
// หน้าจำลอง "เครือข่ายคลังสินค้า" — ไม่ได้อิงพิกัดจริง แค่จัดวางคลังเป็นแผนผัง
// เครือข่าย (เส้นเชื่อมจุด) แล้วไล่ดูลึกลงไปทีละชั้น:
//   1) ภาพรวมเครือข่าย (รายชื่อคลังทั้งหมด)
//   2) ภายในคลังหนึ่ง แบ่งเป็นโซนตามอักษรนำหน้ารหัส location (เช่น "A-01-01" → โซน A)
//   3) รายละเอียด location เดียว: ความจุ (ประมาณการ) + รายการสินค้าที่อยู่ในนั้นจริง
//
// หมายเหตุสำคัญ: ตัวเลข "ความจุ" และ "จอง" ยังไม่มีคอลัมน์เก็บจริงในระบบ (ไม่มี
// capacity/reserved ต่อ location) จึงเป็นค่าประมาณเพื่อให้เห็นภาพ ไม่ใช่ค่าจริง
// ถ้าต้องการให้แม่นยำ ต้องเพิ่มคอลัมน์ capacity ที่ตาราง locations และ track
// reserved quantity ตอนยืนยันใบสั่งขาย (ดูท้ายไฟล์ที่ comment ไว้)
// ──────────────────────────────────────────────────────────────────────────

// ตำแหน่งจุดบนเส้นเครือข่าย (แค่กระจายให้ดูมีจังหวะ ไม่อิงภูมิศาสตร์จริง)
const NETWORK_POSITIONS = [
  { top: "18%", left: "22%" },
  { top: "38%", left: "58%" },
  { top: "60%", left: "30%" },
  { top: "78%", left: "68%" },
  { top: "28%", left: "80%" },
  { top: "50%", left: "12%" },
];

function zoneOf(code) {
  if (!code) return "__general__";
  const [first] = code.split("-");
  return first || "__general__";
}

function parseCode(code) {
  // "A-01-01" → { aisle: "A", rack: "01", shelf: "01" }
  const parts = (code || "").split("-");
  return { aisle: parts[0] || "—", rack: parts[1] || "—", shelf: parts[2] || "—" };
}

function StorageExplorer() {
  const { state } = useStore();
  const { t } = useLang();
  const [view, setView] = useState("network"); // network | warehouse | location
  const [warehouseId, setWarehouseId] = useState(null);
  const [zone, setZone] = useState(null);
  const [locationId, setLocationId] = useState(null);

  const warehouse = warehouseId ? state.warehouses.find((w) => w.id === warehouseId) : null;
  const location = locationId ? state.locations.find((l) => l.id === locationId) : null;

  const warehouseLocations = useMemo(
    () => (warehouseId ? state.locations.filter((l) => l.warehouseId === warehouseId) : []),
    [state.locations, warehouseId]
  );

  const zones = useMemo(() => {
    const map = new Map();
    for (const loc of warehouseLocations) {
      const z = zoneOf(loc.code);
      if (!map.has(z)) map.set(z, []);
      map.get(z).push(loc);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [warehouseLocations]);

  const zoneLocations = zone ? warehouseLocations.filter((l) => zoneOf(l.code) === zone) : [];

  const locationInventory = useMemo(() => {
    if (!locationId) return [];
    return state.inventory
      .filter((i) => i.locationId === locationId)
      .map((i) => ({ ...i, product: getProduct(state, i.productId) }))
      .filter((i) => i.product);
  }, [state, locationId]);

  const totalUnits = locationInventory.reduce((s, i) => s + i.quantity, 0);
  // ยังไม่มี field "reserved" ต่อ location จริงในระบบ — ตั้งเป็น 0 ไว้ก่อน
  const reservedUnits = 0;
  const availableUnits = totalUnits - reservedUnits;
  // ยังไม่มี field "capacity" จริง — ประมาณจากยอดปัจจุบันให้แถบดูมีความหมาย
  const estimatedCapacity = Math.max(totalUnits + 30, 100);
  const fillPct = Math.min(100, Math.round((totalUnits / estimatedCapacity) * 100));

  const goNetwork = () => { setView("network"); setWarehouseId(null); setZone(null); setLocationId(null); };
  const goWarehouse = (id) => { setWarehouseId(id); setZone(null); setLocationId(null); setView("warehouse"); };
  const goZone = (z) => { setZone(z); };
  const goLocation = (id) => { setLocationId(id); setView("location"); };
  const backToWarehouse = () => { setLocationId(null); setView("warehouse"); };

  return (
    <div>
      {/* ────────────────────────── Level 1: Network overview ────────────────────────── */}
      {view === "network" && (
        <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-8">
          <div className="text-xs font-semibold tracking-wide text-slate-400 mb-1">{t("storage.networkLabel")}</div>
          <h2 className="text-xl font-bold text-slate-800 mb-6">{t("storage.heroTitle")}</h2>

          <div className="relative h-72 rounded-lg border border-dashed border-slate-300 bg-white overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {state.warehouses.map((w, i) => {
                if (i === 0) return null;
                const a = NETWORK_POSITIONS[(i - 1) % NETWORK_POSITIONS.length];
                const b = NETWORK_POSITIONS[i % NETWORK_POSITIONS.length];
                return (
                  <line
                    key={w.id}
                    x1={a.left} y1={a.top} x2={b.left} y2={b.top}
                    stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4"
                  />
                );
              })}
            </svg>

            {state.warehouses.map((w, i) => {
              const pos = NETWORK_POSITIONS[i % NETWORK_POSITIONS.length];
              const count = state.locations.filter((l) => l.warehouseId === w.id).length;
              return (
                <button
                  key={w.id}
                  onClick={() => goWarehouse(w.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
                  style={{ top: pos.top, left: pos.left }}
                >
                  <span className="h-3.5 w-3.5 rounded-full bg-red-500 ring-4 ring-red-100 group-hover:ring-red-200 transition" />
                  <span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm group-hover:border-slate-300 group-hover:shadow transition">
                    <div className="font-semibold text-slate-700">{w.name}</div>
                    <div className="font-mono text-[10px] text-slate-400">{w.code} · {t(count === 1 ? "storage.locationCount" : "storage.locationCountPlural", { count })}</div>
                  </span>
                </button>
              );
            })}

            {state.warehouses.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
                {t("storage.noWarehouses")}
              </div>
            )}
          </div>

          <div className="text-xs text-slate-400 mt-3">{t("storage.hint")}</div>
        </div>
      )}

      {/* ────────────────────────── Level 2: Warehouse → zones ────────────────────────── */}
      {view === "warehouse" && warehouse && (
        <div>
          <button onClick={goNetwork} className="text-sm text-slate-500 hover:text-slate-700 mb-4">{t("storage.backNetwork")}</button>

          <div className="mb-6">
            <div className="text-xs font-semibold tracking-wide text-slate-400">{warehouse.address || t("storage.noAddress")}</div>
            <h2 className="text-xl font-bold text-slate-800">{warehouse.name}</h2>
            <div className="font-mono text-xs text-slate-400">{warehouse.code}</div>
          </div>

          {zone === null ? (
            <div className="grid grid-cols-3 gap-3">
              {zones.map(([z, locs]) => (
                <button
                  key={z}
                  onClick={() => goZone(z)}
                  className="rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-slate-300 hover:shadow-sm transition"
                >
                  <div className="text-2xl font-bold text-slate-800">{z === "__general__" ? t("storage.generalZone") : z}</div>
                  <div className="text-xs text-slate-400 mt-1">{t(locs.length === 1 ? "storage.locationCount" : "storage.locationCountPlural", { count: locs.length })}</div>
                </button>
              ))}
              {zones.length === 0 && (
                <div className="col-span-3 text-sm text-slate-400 py-8 text-center">{t("storage.noLocations")}</div>
              )}
            </div>
          ) : (
            <div>
              <button onClick={() => setZone(null)} className="text-sm text-slate-500 hover:text-slate-700 mb-3">{t("storage.backZone", { zone: zone === "__general__" ? t("storage.generalZone") : zone })}</button>
              <div className="grid grid-cols-3 gap-2">
                {zoneLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => goLocation(loc.id)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-slate-300 hover:shadow-sm transition"
                  >
                    <div className="font-mono text-sm font-semibold text-slate-700">{loc.code}</div>
                    <div className="text-xs text-slate-400">{loc.name || "—"}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────── Level 3: Location detail ────────────────────────── */}
      {view === "location" && location && (
        <div>
          <button onClick={backToWarehouse} className="text-sm text-slate-500 hover:text-slate-700 mb-4">← {warehouse?.name}</button>

          <div className="mb-6">
            <h2 className="text-xl font-bold font-mono text-slate-800">{location.code}</h2>
            <div className="text-xs text-slate-400">
              {(() => { const p = parseCode(location.code); return t("storage.aisleRackShelf", { aisle: p.aisle, rack: p.rack, shelf: p.shelf }); })()}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>{t("storage.capacity")}</span>
              <span>{fillPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${fillPct >= 90 ? "bg-red-400" : fillPct >= 70 ? "bg-amber-400" : "bg-emerald-400"}`}
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div>
                <div className="text-lg font-bold text-slate-800">{totalUnits}</div>
                <div className="text-[11px] text-slate-400">{t("storage.units")}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{reservedUnits}</div>
                <div className="text-[11px] text-slate-400">{t("storage.reserved")}</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">{availableUnits}</div>
                <div className="text-[11px] text-slate-400">{t("storage.available")}</div>
              </div>
            </div>
          </div>

          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">{t("storage.productsHere")}</div>
          <div className="table-container">
            <table className="data-table">
              <thead><tr><th>{t("storage.colSku")}</th><th>{t("storage.colProduct")}</th><th>{t("storage.colQty")}</th></tr></thead>
              <tbody>
                {locationInventory.map((i) => (
                  <tr key={i.productId}>
                    <td className="font-mono text-xs">{i.product.sku}</td>
                    <td>{i.product.name}</td>
                    <td className="font-semibold">{i.quantity}</td>
                  </tr>
                ))}
                {locationInventory.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-slate-400 py-6">{t("storage.emptyLocation")}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default StorageExplorer;