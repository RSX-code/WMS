// ตัวกลางคุยกับ backend (.NET + Dapper + PostgreSQL)

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5080/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;

    try {
      const body = await res.json();
      // FastEndpoints ส่ง validation error มาเป็น { message, errors: { field: [..] } }
      const fieldErrors = body.errors
        ? Object.entries(body.errors).map(([f, msgs]) => `${f}: ${[].concat(msgs).join(", ")}`).join(" | ")
        : "";
      message = body.error || fieldErrors || body.message || body.title || message;
    } catch {}

    throw new Error(message);
  }

  if (res.status === 204) return null;

  return res.json();
}

const get = (path) => request(path);

const post = (path, body) =>
  request(path, {
    method: "POST",
    // endpoint ที่ไม่มี payload (confirm/cancel/mark-ordered/fulfill ฯลฯ) ยังต้องได้ Content-Type
    // เป็น JSON เพื่อผ่าน model binding ฝั่ง .NET จึงส่ง "{}" แทนการไม่ส่ง body เลย
    // ช่องว่าง ("") จาก form (เช่น expectedDate ที่ไม่ได้เลือก) ต้องส่งเป็น null
    // ไม่งั้น backend แปลงเป็นวันที่/Guid ไม่ได้แล้วตอบ 400
    body: JSON.stringify(body ?? {}, (_key, value) => (value === "" ? null : value)),
  });

const del = (path) =>
  request(path, {
    method: "DELETE",
  });

export const api = {
  getBootstrap: () => get("/bootstrap"),

  // Categories
  saveCategory: (payload) => post("/categories", payload),
  deleteCategory: (id) => del(`/categories/${id}`),

  // Products
  getProducts: () => get("/products"),
  getProductByBarcode: (barcode) => get(`/products/barcode/${encodeURIComponent(barcode)}`),
  saveProduct: (payload) => post("/products", payload),
  deleteProduct: (id) => del(`/products/${id}`),

  // Warehouses
  saveWarehouse: (payload) => post("/warehouses", payload),
  deleteWarehouse: (id) => del(`/warehouses/${id}`),

  // Locations
  saveLocation: (payload) => post("/locations", payload),
  deleteLocation: (id) => del(`/locations/${id}`),

  // Suppliers
  saveSupplier: (payload) => post("/suppliers", payload),
  deleteSupplier: (id) => del(`/suppliers/${id}`),

  // Customers
  saveCustomer: (payload) => post("/customers", payload),
  deleteCustomer: (id) => del(`/customers/${id}`),

  // Inventory
  adjustStock: (payload) => post("/inventory/adjust", payload),
  transferStock: (payload) => post("/inventory/transfer", payload),

  // Purchase Orders
  createPurchaseOrder: (payload) =>
    post("/purchase-orders", payload),

  markPoOrdered: (id) =>
    post(`/purchase-orders/${id}/mark-ordered`),

  cancelPo: (id) =>
    post(`/purchase-orders/${id}/cancel`),

  deletePo: (id) =>
    del(`/purchase-orders/${id}`),

  receivePoItems: (id, locationId, receipts) =>
    post(`/purchase-orders/${id}/receive`, {
      locationId,
      receipts,
    }),

  // Sales Orders
  createSalesOrder: (payload) =>
    post("/sales-orders", payload),

  confirmSalesOrder: (id) =>
    post(`/sales-orders/${id}/confirm`),

  cancelSalesOrder: (id) =>
    post(`/sales-orders/${id}/cancel`),

  deleteSalesOrder: (id) =>
    del(`/sales-orders/${id}`),

  fulfillSalesOrder: (id) =>
    post(`/sales-orders/${id}/fulfill`),
};