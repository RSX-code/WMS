using Dapper;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Application.Interfaces;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Dapper;

public class ProductDapperRepository
{
    private readonly IDbConnectionFactory _factory;
    public ProductDapperRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<IEnumerable<Product>> GetAllAsync()
    {
        using var conn = _factory.CreateConnection();
        return await conn.QueryAsync<Product>("SELECT * FROM products ORDER BY created_at");
    }

    public async Task<Product?> GetByIdAsync(Guid id)
    {
        using var conn = _factory.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Product>("SELECT * FROM products WHERE id = @Id", new { Id = id });
    }

    public async Task<Product?> GetByBarcodeAsync(string barcode)
    {
        using var conn = _factory.CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Product>(
            "SELECT * FROM products WHERE barcode = @Barcode",
            new { Barcode = barcode.Trim() });
    }

    public async Task<IEnumerable<Product>> SearchAsync(Guid? categoryId, bool? isActive, string? keyword)
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            SELECT * FROM products
            WHERE (@CategoryId IS NULL OR category_id = @CategoryId)
              AND (@IsActive IS NULL OR is_active = @IsActive)
              AND (@Keyword IS NULL OR name ILIKE '%' || @Keyword || '%' OR sku ILIKE '%' || @Keyword || '%')
            ORDER BY created_at";
        return await conn.QueryAsync<Product>(sql, new { CategoryId = categoryId, IsActive = isActive, Keyword = keyword });
    }

    public record ProductWithCategoryRow(Guid Id, string Sku, string Name, decimal SellingPrice, string CategoryName);

    public async Task<IEnumerable<ProductWithCategoryRow>> GetWithCategoryAsync()
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            SELECT p.id, p.sku, p.name, p.selling_price, c.name AS category_name
            FROM products p
            JOIN categories c ON c.id = p.category_id
            WHERE p.is_active = true
            ORDER BY p.created_at";
        return await conn.QueryAsync<ProductWithCategoryRow>(sql);
    }

    public record LowStockRow(string Sku, string Name, int MinimumStock, long TotalQuantity);

    public async Task<IEnumerable<LowStockRow>> GetLowStockReportAsync(Guid warehouseId)
    {
        using var conn = _factory.CreateConnection();
        const string sql = @"
            SELECT p.sku, p.name, p.minimum_stock, SUM(i.quantity) AS total_quantity
            FROM products p
            JOIN inventory i ON i.product_id = p.id
            JOIN locations l ON l.id = i.location_id
            WHERE l.warehouse_id = @WarehouseId
            GROUP BY p.id, p.sku, p.name, p.minimum_stock
            HAVING SUM(i.quantity) < p.minimum_stock
            ORDER BY p.sku";
        return await conn.QueryAsync<LowStockRow>(sql, new { WarehouseId = warehouseId });
    }

    // ---------- UPSERT (endpoint ที่ปุ่ม "เพิ่ม/แก้ไขสินค้า" ฝั่ง front เรียก) ----------
    public async Task<Product> SaveAsync(SaveProductRequest req)
    {
        using var conn = _factory.CreateConnection();

        if (req.Id is Guid id)
        {
            const string sql = @"
                UPDATE products
                SET sku = @Sku, name = @Name, description = @Description, category_id = @CategoryId,
                    barcode = @Barcode, unit = @Unit, cost_price = @CostPrice, selling_price = @SellingPrice,
                    minimum_stock = @MinimumStock, is_active = @IsActive, updated_at = now()
                WHERE id = @Id RETURNING *";
            var updated = await conn.QuerySingleOrDefaultAsync<Product>(sql, new
            {
                req.Sku, req.Name, req.Description, req.CategoryId, req.Barcode, req.Unit,
                req.CostPrice, req.SellingPrice, req.MinimumStock, req.IsActive, Id = id
            });
            if (updated is null) throw new NotFoundException("Product", id);
            return updated;
        }
        else
        {
            const string sql = @"
                INSERT INTO products (id, sku, name, description, category_id, barcode, unit, cost_price, selling_price, minimum_stock, is_active, created_at, updated_at)
                VALUES (@Id, @Sku, @Name, @Description, @CategoryId, @Barcode, @Unit, @CostPrice, @SellingPrice, @MinimumStock, @IsActive, now(), now())
                RETURNING *";
            return await conn.QuerySingleAsync<Product>(sql, new
            {
                Id = Guid.NewGuid(),
                req.Sku, req.Name, req.Description, req.CategoryId, req.Barcode, req.Unit,
                req.CostPrice, req.SellingPrice, req.MinimumStock, req.IsActive
            });
        }
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        using var conn = _factory.CreateConnection();
        var rows = await conn.ExecuteAsync("DELETE FROM products WHERE id = @Id", new { Id = id });
        return rows > 0;
    }
}
