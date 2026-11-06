using Wms.Application.DTOs;

namespace Wms.Infrastructure.Dapper;

// รวมทุกอย่างในครั้งเดียว เหมือน seed.js — ให้ front โหลดครั้งเดียวตอนเปิดแอป
public class BootstrapDapperRepository
{
    private readonly CategoryDapperRepository _categories;
    private readonly ProductDapperRepository _products;
    private readonly WarehouseDapperRepository _warehouses;
    private readonly LocationDapperRepository _locations;
    private readonly InventoryDapperRepository _inventory;
    private readonly SupplierDapperRepository _suppliers;
    private readonly CustomerDapperRepository _customers;
    private readonly PurchaseOrderDapperRepository _purchaseOrders;
    private readonly SalesOrderDapperRepository _salesOrders;

    public BootstrapDapperRepository(
        CategoryDapperRepository categories, ProductDapperRepository products,
        WarehouseDapperRepository warehouses, LocationDapperRepository locations,
        InventoryDapperRepository inventory, SupplierDapperRepository suppliers,
        CustomerDapperRepository customers, PurchaseOrderDapperRepository purchaseOrders,
        SalesOrderDapperRepository salesOrders)
    {
        _categories = categories; _products = products; _warehouses = warehouses;
        _locations = locations; _inventory = inventory; _suppliers = suppliers;
        _customers = customers; _purchaseOrders = purchaseOrders; _salesOrders = salesOrders;
    }

    public async Task<BootstrapDto> GetAsync()
    {
        var products = (await _products.GetAllAsync())
            .Select(p => new ProductDto(p.Id, p.Sku, p.Name, p.Description, p.CategoryId, p.Barcode, p.Unit, p.CostPrice, p.SellingPrice, p.MinimumStock, p.IsActive))
            .ToList();

        return new BootstrapDto(
            await _categories.ListAsync(),
            products,
            await _warehouses.ListAsync(),
            await _locations.ListAsync(),
            await _inventory.ListAsync(),
            await _inventory.ListTransactionsAsync(),
            await _suppliers.ListAsync(),
            await _customers.ListAsync(),
            await _purchaseOrders.ListAsync(),
            await _salesOrders.ListAsync());
    }
}
