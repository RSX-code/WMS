namespace Wms.Application.DTOs;

// Mirrors the shape of src/data/seed.js so the existing frontend reducer
// can be swapped for a single fetch with minimal changes.
public record BootstrapDto(
    List<CategoryDto> Categories,
    List<ProductDto> Products,
    List<WarehouseDto> Warehouses,
    List<LocationDto> Locations,
    List<InventoryDto> Inventory,
    List<TransactionDto> Transactions,
    List<SupplierDto> Suppliers,
    List<CustomerDto> Customers,
    List<PurchaseOrderDto> PurchaseOrders,
    List<SalesOrderDto> SalesOrders);
