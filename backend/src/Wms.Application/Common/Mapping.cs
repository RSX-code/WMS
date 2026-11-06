using Wms.Application.DTOs;
using Wms.Domain.Entities;

namespace Wms.Application.Common;

public static class Mapping
{
    public static CategoryDto ToDto(this Category c) => new(c.Id, c.Name, c.Description, c.IsActive);
    public static ProductDto ToDto(this Product p) => new(p.Id, p.Sku, p.Name, p.Description, p.CategoryId, p.Barcode, p.Unit, p.CostPrice, p.SellingPrice, p.MinimumStock, p.IsActive);
    public static WarehouseDto ToDto(this Warehouse w) => new(w.Id, w.Code, w.Name, w.Address, w.IsActive);
    public static LocationDto ToDto(this Location l) => new(l.Id, l.WarehouseId, l.Code, l.Name, l.IsActive);
    public static SupplierDto ToDto(this Supplier s) => new(s.Id, s.Code, s.Name, s.Phone, s.Email, s.Address, s.IsActive);
    public static CustomerDto ToDto(this Customer c) => new(c.Id, c.Code, c.Name, c.Phone, c.Email, c.Address, c.IsActive);
    public static InventoryDto ToDto(this Inventory i) => new(i.Id, i.ProductId, i.LocationId, i.Quantity, i.ReservedQuantity);
    public static TransactionDto ToDto(this InventoryTransaction t) => new(t.Id, t.ProductId, t.FromLocationId, t.ToLocationId, t.Quantity, t.TransactionType, t.ReferenceType, t.ReferenceId, t.CreatedAt);
    public static PurchaseOrderItemDto ToDto(this PurchaseOrderItem i) => new(i.Id, i.PurchaseOrderId, i.ProductId, i.Quantity, i.UnitCost, i.ReceivedQuantity);
    public static SalesOrderItemDto ToDto(this SalesOrderItem i) => new(i.Id, i.SalesOrderId, i.ProductId, i.Quantity, i.UnitPrice);
}
