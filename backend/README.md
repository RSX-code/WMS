# WMS API (.NET 8 backend)

Backend สำหรับ WMS frontend (React + Vite) — Clean Architecture, FastEndpoints,
EF Core + Npgsql, PostgreSQL, FluentValidation, Swagger/OpenAPI

## โครงสร้างโปรเจกต์

```
src/
  Wms.Domain/         entities ล้วนๆ ไม่มี dependency ภายนอก
  Wms.Application/    DTOs, interfaces (IAppDbContext), business logic services
  Wms.Infrastructure/ EF Core DbContext, PostgreSQL config, seed data
  Wms.Api/             FastEndpoints endpoints, Program.cs, Swagger, CORS
```

ข้อมูล 12 ตาราง (categories, products, warehouses, locations, inventory,
inventory_transactions, suppliers, customers, purchase_orders,
purchase_order_items, sales_orders, sales_order_items) และ seed data
ตรงกับ `src/data/seed.js` ของฝั่ง frontend ทุกแถว — ตอนรันครั้งแรกจะมีข้อมูล
ตัวอย่างชุดเดียวกับที่ frontend เคยโชว์ผ่าน localStorage

## เตรียมเครื่อง (ครั้งแรกเท่านั้น)

ต้องมี:
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Docker (สำหรับรัน PostgreSQL) หรือ PostgreSQL ที่ติดตั้งเองก็ได้
- `dotnet-ef` CLI tool:
  ```bash
  dotnet tool install --global dotnet-ef
  ```

## วิธีรัน

**1) สตาร์ท PostgreSQL**
```bash
docker compose up -d
```

**2) สร้าง migration แรก** (โปรเจกต์นี้ยังไม่มี migration มาให้ เพราะสภาพแวดล้อมที่สร้างโค้ดนี้ไม่มี .NET SDK ให้รัน `dotnet ef` ได้ — ต้องรันเองครั้งแรกที่เครื่องคุณ)
```bash
cd src/Wms.Api
dotnet ef migrations add InitialCreate --project ../Wms.Infrastructure --startup-project .
```

**3) รัน API** (จะ apply migration + seed ข้อมูลให้อัตโนมัติตอน startup เพราะมี `db.Database.Migrate()` ใน `Program.cs`)
```bash
dotnet run --project src/Wms.Api
```

API จะรันที่ `http://localhost:5080` และเปิด Swagger UI อัตโนมัติที่
`http://localhost:5080/swagger`

## Endpoints หลัก

| Method | Path | ทำอะไร |
|---|---|---|
| GET | `/api/bootstrap` | ดึงข้อมูลทั้งหมดในครั้งเดียว (รูปแบบเดียวกับ `seed.js`) เหมาะสำหรับโหลดตอนเปิดแอป |
| GET/POST/DELETE | `/api/categories` , `/{id}` | หมวดหมู่สินค้า |
| GET/POST/DELETE | `/api/products` , `/{id}` | **สินค้า — endpoint ที่ปุ่ม "เพิ่มสินค้า" ต้องเรียก** |
| GET/POST/DELETE | `/api/warehouses`, `/api/locations` | คลัง/ตำแหน่งจัดเก็บ |
| GET/POST/DELETE | `/api/suppliers`, `/api/customers` | ซัพพลายเออร์/ลูกค้า |
| GET | `/api/inventory`, `/api/inventory/transactions` | สต็อกปัจจุบัน / ประวัติการเคลื่อนไหว |
| POST | `/api/inventory/adjust` | ปรับสต็อก (เพิ่ม/ลด) |
| POST | `/api/inventory/transfer` | โอนสต็อกระหว่างตำแหน่ง |
| GET/POST/DELETE | `/api/purchase-orders` , `/{id}` | ใบสั่งซื้อ (PO) |
| POST | `/api/purchase-orders/{id}/mark-ordered` \| `/cancel` \| `/receive` | เปลี่ยนสถานะ PO / รับของเข้าคลัง |
| GET/POST/DELETE | `/api/sales-orders` , `/{id}` | **ใบสั่งขาย (SO) — endpoint ที่ "ลูกค้าสั่งซื้อสินค้า" ต้องเรียก** |
| POST | `/api/sales-orders/{id}/confirm` \| `/cancel` \| `/fulfill` | ยืนยันจองสต็อก / ยกเลิก / ตัดสต็อกส่งของ |

Response ทุกตัวเป็น JSON, ใช้ camelCase (ตั้งค่าไว้ใน `Program.cs`) — ตรงกับ
รูปแบบ field ที่ frontend ใช้อยู่แล้วใน `seed.js`/`reducer.js` เลย ไม่ต้องแปลงชื่อ field เพิ่ม

## Business logic ที่พอร์ตมาจาก reducer.js

`Wms.Application/Services/InventoryService.cs`, `PurchaseOrderService.cs`,
`SalesOrderService.cs` ทำ logic เดียวกับ `src/store/reducer.js` ของ frontend
ทุกเคส (การจองสต็อกแบบเลือกตำแหน่งที่มีของเยอะสุดก่อน, การตัดสต็อกตอน fulfill
โดยดึงจากส่วนที่จองไว้ก่อนแล้วค่อยดึงจากส่วนที่ว่าง, การเช็คว่า PO รับครบ
ทุก item แล้วเปลี่ยนสถานะเป็น RECEIVED อัตโนมัติ ฯลฯ)

## CORS

ตั้งค่าไว้อนุญาต origin `http://localhost:5173` (ค่า default ของ Vite dev
server) ใน `appsettings.json` → `Cors:AllowedOrigins` — ถ้า deploy จริงหรือ
frontend รันที่ port อื่น ให้แก้ตรงนี้

## ขั้นตอนถัดไป

โปรเจกต์นี้เป็น backend ล้วนๆ ยังไม่ได้แก้ฝั่ง frontend — ขั้นต่อไปคือสร้าง
`src/api.js` ในโปรเจกต์ React แล้วแก้ `StoreContext.jsx`/`reducer.js` ให้เรียก
endpoint พวกนี้แทนการเก็บใน localStorage (ตามที่คอมเมนต์ในโค้ด frontend
เตรียมจุดไว้ให้แล้ว)
