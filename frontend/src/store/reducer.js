// business logic (จองสต็อก, ตัดสต็อก, สร้างเลข PO/SO ฯลฯ) ทั้งหมดย้ายไปอยู่
// backend (.NET + Dapper) แล้ว — reducer นี้เหลือหน้าที่เดียวคือ "รับข้อมูลจริง
// จาก server แล้วแทนที่ state ทั้งก้อน" ทุกครั้งที่มีการเปลี่ยนแปลง (ดู
// StoreContext.jsx ที่เรียก api แล้ว dispatch HYDRATE กลับมาเก็บผลลัพธ์)

export const initialState = () => ({
  categories: [], products: [], warehouses: [], locations: [],
  inventory: [], transactions: [], suppliers: [], customers: [],
  purchaseOrders: [], purchaseOrderItems: [], salesOrders: [], salesOrderItems: [],
  _loading: true, _error: null,
})

// backend คืน purchaseOrders/salesOrders พร้อม items ซ้อนอยู่ข้างใน (po.items)
// แต่หน้า UI เดิมคาดหวัง 2 array แยกกัน (purchaseOrders + purchaseOrderItems)
// ฟังก์ชันนี้แค่แยกมันออกจากกันให้ตรงกับที่ของเดิมใช้
// backend ส่ง transactions เรียงใหม่→เก่า แต่ Dashboard/Transactions เขียนไว้ให้ใช้
// reverse() เอาล่าสุดขึ้นก่อน (คาดว่าข้อมูลเรียงเก่า→ใหม่) เลยต้องเรียงกลับให้ตรงกัน
// และแปลง createdAt จาก ISO ("2026-08-27T09:15:00Z") เป็น "2026-08-27 09:15" เวลาเครื่อง
function normalizeTransactions(list) {
  const pad = (n) => String(n).padStart(2, '0')
  const time = (v) => Date.parse(v) || 0
  const stamp = (v) => {
    const d = new Date(v)
    if (isNaN(d)) return v ?? ''
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return [...list]
    .sort((a, b) => time(a.createdAt) - time(b.createdAt))
    .map((tx) => ({ ...tx, createdAt: stamp(tx.createdAt) }))
}

function flattenBootstrap(data) {
  const purchaseOrderItems = (data.purchaseOrders || []).flatMap(po => po.items || [])
  const salesOrderItems = (data.salesOrders || []).flatMap(so => so.items || [])
  const stripItems = (arr) => arr.map(({ items, ...rest }) => rest)

  return {
    categories: data.categories || [],
    products: data.products || [],
    warehouses: data.warehouses || [],
    locations: data.locations || [],
    inventory: data.inventory || [],
    transactions: normalizeTransactions(data.transactions || []),
    suppliers: data.suppliers || [],
    customers: data.customers || [],
    purchaseOrders: stripItems(data.purchaseOrders || []),
    purchaseOrderItems,
    salesOrders: stripItems(data.salesOrders || []),
    salesOrderItems,
    _loading: false,
    _error: null,
  }
}

export function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        ...flattenBootstrap(action.payload),
        _lastShortages: action.shortages !== undefined ? action.shortages : state._lastShortages,
      }
    case 'SET_LOADING':
      return { ...state, _loading: action.value }
    case 'SET_ERROR':
      return { ...state, _error: action.message, _loading: false }
    default:
      return state
  }
}