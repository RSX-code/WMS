// Pure helpers — take state as a parameter instead of reading a global DATA object.
export const byId = (arr, id) => arr.find(x => x.id === id)
export const nextId = (arr) => arr.reduce((m, x) => Math.max(m, x.id), 0) + 1
export const fmt = (n) => Number(n || 0).toLocaleString('en-US')
export const fmtc = (n) => '$' + Number(n || 0).toFixed(2)

export function nowStr() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export const getCategory = (state, id) => byId(state.categories, id)
export const getProduct = (state, id) => byId(state.products, id)
export const getWarehouse = (state, id) => byId(state.warehouses, id)
export const getLocation = (state, id) => byId(state.locations, id)
export const getSupplier = (state, id) => byId(state.suppliers, id)
export const getCustomer = (state, id) => byId(state.customers, id)

export const locationLabel = (state, id) => {
  const l = getLocation(state, id)
  if (!l) return '—'
  const w = getWarehouse(state, l.warehouseId)
  return `${l.code} · ${w ? w.code : ''}`
}

export function stockAvailable(inv) { return inv.quantity - inv.reservedQuantity }
export function stockStatus(inv, minStock) {
  if (inv.quantity <= 0) return 'Out of Stock'
  if (inv.quantity < minStock) return 'Low Stock' // ต่ำกว่าขั้นต่ำเท่านั้น (20/20 = ยังพอดี ไม่ถือว่าต่ำ)
  return 'In Stock'
}

export const poItemsFor = (state, poId) => state.purchaseOrderItems.filter(i => i.purchaseOrderId === poId)
export const soItemsFor = (state, soId) => state.salesOrderItems.filter(i => i.salesOrderId === soId)
export const poTotal = (state, poId) => poItemsFor(state, poId).reduce((s, i) => s + i.quantity * i.unitCost, 0)
export const soTotal = (state, soId) => soItemsFor(state, soId).reduce((s, i) => s + i.quantity * i.unitPrice, 0)

export function locationOptions(state) {
  return state.locations.filter(l => l.isActive).map(l => {
    const w = getWarehouse(state, l.warehouseId)
    return { value: l.id, label: `${w ? w.code : ''} · ${l.code} — ${l.name}` }
  })
}