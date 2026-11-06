import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useStore } from "../store/StoreContext.jsx";
import { useLang } from "../i18n/LangContext.jsx";
import {
  getProduct, getCategory, getSupplier, getCustomer,
  stockStatus, poTotal, soTotal, fmt, fmtc,
} from "../lib/helpers.js";
import { StockBadge, PoStatusBadge, SoStatusBadge, TxnTypeBadge } from "../components/Badge.jsx";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function StatCard({ icon, label, value, desc, color }) {
  const colorMap = {
    brand: "bg-indigo-50 text-indigo-600",
    slate: "bg-slate-100 text-slate-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  };
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-bold leading-tight mt-1">{value}</div>
          <div className="text-[11px] text-slate-400 mt-1">{desc}</div>
        </div>
        <div className={`w-9 h-9 rounded-lg ${colorMap[color]} flex items-center justify-center flex-shrink-0`}>
          <i className={`fa-solid ${icon} text-sm`}></i>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { state } = useStore();
  const { t } = useLang();

  const totalProducts = state.products.filter((p) => p.isActive).length;
  const totalStock = state.inventory.reduce((s, i) => s + i.quantity, 0);
  const invWithStatus = state.inventory.map((i) => ({
    ...i,
    status: stockStatus(i, getProduct(state, i.productId)?.minimumStock || 0),
  }));
  const lowStock = invWithStatus.filter((i) => i.status === "Low Stock").length;
  const outStock = invWithStatus.filter((i) => i.status === "Out of Stock").length;
  const pendingPO = state.purchaseOrders.filter((p) => p.status === "DRAFT" || p.status === "ORDERED").length;
  const pendingSO = state.salesOrders.filter((s) => s.status === "DRAFT" || s.status === "CONFIRMED").length;

  const catChart = {
    labels: state.categories.map((c) => c.name),
    datasets: [{
      label: t("dash.units"),
      data: state.categories.map((cat) =>
        state.inventory
          .filter((i) => getProduct(state, i.productId)?.categoryId === cat.id)
          .reduce((s, i) => s + i.quantity, 0)
      ),
      backgroundColor: "#4F46E5",
      borderRadius: 4,
      barThickness: 22,
    }],
  };

  const statusChart = {
    labels: [t("badge.stock.In Stock"), t("badge.stock.Low Stock"), t("badge.stock.Out of Stock")],
    datasets: [{
      data: [invWithStatus.filter((i) => i.status === "In Stock").length, lowStock, outStock],
      backgroundColor: ["#059669", "#D97706", "#DC2626"],
      borderWidth: 0,
    }],
  };

  const lowItems = invWithStatus
    .filter((i) => i.status !== "In Stock")
    .slice(0, 6)
    .map((i) => {
      const p = getProduct(state, i.productId);
      return { sku: p?.sku, name: p?.name, qty: i.quantity, min: p?.minimumStock, status: i.status };
    });

  const recentTxn = [...state.transactions].reverse().slice(0, 6);
  const recentPO = [...state.purchaseOrders].reverse().slice(0, 5);
  const recentSO = [...state.salesOrders].reverse().slice(0, 5);

  return (
    <div>
      <div className="kpi-grid mb-5">
        <StatCard icon="fa-box" label={t("dash.products")} value={totalProducts} desc={t("dash.activeSkus")} color="brand" />
        <StatCard icon="fa-cubes" label={t("dash.totalStock")} value={fmt(totalStock)} desc={t("dash.unitsOnHand")} color="slate" />
        <StatCard icon="fa-triangle-exclamation" label={t("dash.lowStock")} value={lowStock} desc={t("dash.belowMin")} color="warning" />
        <StatCard icon="fa-ban" label={t("dash.outStock")} value={outStock} desc={t("dash.zeroQty")} color="danger" />
        <StatCard icon="fa-cart-shopping" label={t("dash.pendingPO")} value={pendingPO} desc={t("dash.awaitingDelivery")} color="brand" />
        <StatCard icon="fa-file-invoice" label={t("dash.pendingSO")} value={pendingSO} desc={t("dash.awaitingFulfillment")} color="warning" />
      </div>

      <div className="chart-row mb-5">
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-700 mb-3">{t("dash.stockByCategory")}</div>
          <div style={{ height: 220, width: "100%", position: "relative" }}>
            <Bar data={catChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: "#F1F5F9" }, ticks: { font: { size: 10 } } }, x: { grid: { display: false }, ticks: { font: { size: 9 } } } } }} />
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-700 mb-3">{t("dash.stockStatus")}</div>
          <div style={{ height: 220, width: "100%", position: "relative" }}>
            <Doughnut data={statusChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 10 }, padding: 8, usePointStyle: true, pointStyleWidth: 8 } } }, cutout: "65%" }} />
          </div>
        </div>
      </div>

      <div className="two-col-row mb-5">
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-700 mb-3">{t("dash.lowStockProducts")}</div>
          {lowItems.length ? (
            <table className="data-table text-xs">
              <thead><tr><th>{t("dash.colSku")}</th><th>{t("dash.colProduct")}</th><th>{t("dash.colQty")}</th><th>{t("dash.colMin")}</th><th>{t("dash.colStatus")}</th></tr></thead>
              <tbody>
                {lowItems.map((r, idx) => (
                  <tr key={idx}>
                    <td className="font-mono">{r.sku}</td>
                    <td>{r.name}</td>
                    <td className="font-semibold">{r.qty}</td>
                    <td>{r.min}</td>
                    <td><StockBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center">{t("dash.allStocked")}</div>
          )}
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-700 mb-3">{t("dash.recentTxn")}</div>
          <table className="data-table text-xs">
            <thead><tr><th>{t("dash.colType")}</th><th>{t("dash.colProduct")}</th><th>{t("dash.colQty")}</th><th>{t("dash.colDate")}</th></tr></thead>
            <tbody>
              {recentTxn.map((tx) => {
                const p = getProduct(state, tx.productId);
                return (
                  <tr key={tx.id}>
                    <td><TxnTypeBadge type={tx.type} /></td>
                    <td>{p?.name}</td>
                    <td className={`font-semibold ${tx.type === "ISSUE" ? "text-red-600" : "text-emerald-600"}`}>
                      {tx.type === "ISSUE" ? "-" : "+"}{tx.quantity}
                    </td>
                    <td className="text-slate-400">{tx.createdAt}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="two-col-row">
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-700 mb-3">{t("dash.recentPO")}</div>
          <table className="data-table text-xs">
            <thead><tr><th>{t("dash.colPO")}</th><th>{t("dash.colSupplier")}</th><th>{t("dash.colStatus")}</th><th>{t("dash.colCost")}</th></tr></thead>
            <tbody>
              {recentPO.map((po) => (
                <tr key={po.id}>
                  <td className="font-mono font-semibold">{po.poNumber}</td>
                  <td>{getSupplier(state, po.supplierId)?.name}</td>
                  <td><PoStatusBadge status={po.status} /></td>
                  <td className="font-semibold">{fmtc(poTotal(state, po.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card p-4">
          <div className="text-xs font-bold text-slate-700 mb-3">{t("dash.recentSO")}</div>
          <table className="data-table text-xs">
            <thead><tr><th>{t("dash.colOrder")}</th><th>{t("dash.colCustomer")}</th><th>{t("dash.colStatus")}</th><th>{t("dash.colAmount")}</th></tr></thead>
            <tbody>
              {recentSO.map((so) => (
                <tr key={so.id}>
                  <td className="font-mono font-semibold">{so.orderNumber}</td>
                  <td>{getCustomer(state, so.customerId)?.name}</td>
                  <td><SoStatusBadge status={so.status} /></td>
                  <td className="font-semibold">{fmtc(soTotal(state, so.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;