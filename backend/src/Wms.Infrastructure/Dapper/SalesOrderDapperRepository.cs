using System.Data.Common;
using Dapper;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Application.Interfaces;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Dapper;

public class SalesOrderDapperRepository
{
    private readonly IDbConnectionFactory _factory;
    public SalesOrderDapperRepository(IDbConnectionFactory factory) => _factory = factory;

    private static SalesOrderDto ToDto(SalesOrder so, List<SalesOrderItem> items) => new(
        so.Id, so.OrderNumber, so.CustomerId, so.Status, so.OrderDate,
        items.Select(i => i.ToDto()).ToList());

    public async Task<List<SalesOrderDto>> ListAsync()
    {
        using var conn = _factory.CreateConnection();
        var orders = (await conn.QueryAsync<SalesOrder>("SELECT * FROM sales_orders ORDER BY created_at")).ToList();
        var items = (await conn.QueryAsync<SalesOrderItem>("SELECT * FROM sales_order_items")).ToList();
        return orders.Select(so => ToDto(so, items.Where(i => i.SalesOrderId == so.Id).ToList())).ToList();
    }

    // Mirrors reducer.js CREATE_SO — endpoint ที่ "ลูกค้าสั่งซื้อสินค้า" เรียก
    public async Task<SalesOrderDto> CreateAsync(CreateSalesOrderRequest req)
    {
        using var conn = (DbConnection)_factory.CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();
        try
        {
            var count = await conn.ExecuteScalarAsync<long>("SELECT COUNT(*) FROM sales_orders", transaction: tx);
            var orderNumber = $"SO-{DateTime.UtcNow:yyyy}-{(count + 1):000}";
            var soId = Guid.NewGuid();

            var so = await conn.QuerySingleAsync<SalesOrder>(@"
                INSERT INTO sales_orders (id, order_number, customer_id, status, order_date, created_at)
                VALUES (@Id, @OrderNumber, @CustomerId, 'DRAFT', @OrderDate, now())
                RETURNING *",
                new { Id = soId, OrderNumber = orderNumber, req.CustomerId, req.OrderDate }, tx);

            var items = new List<SalesOrderItem>();
            foreach (var it in req.Items)
            {
                var item = await conn.QuerySingleAsync<SalesOrderItem>(@"
                    INSERT INTO sales_order_items (id, sales_order_id, product_id, quantity, unit_price)
                    VALUES (@Id, @SoId, @ProductId, @Quantity, @Price) RETURNING *",
                    new { Id = Guid.NewGuid(), SoId = soId, it.ProductId, it.Quantity, it.Price }, tx);
                items.Add(item);
            }

            await tx.CommitAsync();
            return ToDto(so, items);
        }
        catch { await tx.RollbackAsync(); throw; }
    }

    // Mirrors reducer.js CONFIRM_SO — จองสต็อกจากตำแหน่งที่มีของว่างเยอะสุดก่อน
public async Task<SalesOrderDto> ConfirmAsync(Guid id)
{
    using var conn = (DbConnection)_factory.CreateConnection();
    await conn.OpenAsync();
    using var tx = await conn.BeginTransactionAsync();
    try
    {
        var so = await conn.QuerySingleOrDefaultAsync<SalesOrder>("SELECT * FROM sales_orders WHERE id = @Id", new { Id = id }, tx)
            ?? throw new NotFoundException("SalesOrder", id);
            
        var items = (await conn.QueryAsync<SalesOrderItem>("SELECT * FROM sales_order_items WHERE sales_order_id = @Id", new { Id = id }, tx)).ToList();

        foreach (var item in items)
        {
            var remaining = item.Quantity;
            var rows = (await conn.QueryAsync<Inventory>(
                "SELECT * FROM inventory WHERE product_id = @ProductId AND (quantity - reserved_quantity) > 0 ORDER BY (quantity - reserved_quantity) DESC",
                new { item.ProductId }, tx)).ToList();

            foreach (var inv in rows)
            {
                if (remaining <= 0) break;
                var available = inv.Quantity - inv.ReservedQuantity;
                var take = Math.Min(available, remaining);
                await conn.ExecuteAsync("UPDATE inventory SET reserved_quantity = reserved_quantity + @Take, updated_at = now() WHERE id = @Id", new { Take = take, inv.Id }, tx);
                remaining -= take;
            }

            // แก้ไขจุดนี้: เช็กสต็อกรายสินค้าทันที ถ้าหักสต็อกแล้วยังเหลือยอดที่ต้องการ (แปลว่าสต็อกรวมในระบบไม่พอ)
            if (remaining > 0)
            {
                throw new InvalidOperationException($"สินค้ารหัส {item.ProductId} มีสต็อกไม่เพียงพอสำหรับการจอง");
            }
        }

        // อัปเดตสถานะออเดอร์เป็น CONFIRMED เมื่อจองสินค้าได้ครบทุกรายการแล้ว
        so = await conn.QuerySingleAsync<SalesOrder>("UPDATE sales_orders SET status = 'CONFIRMED' WHERE id = @Id RETURNING *", new { so.Id }, tx);
        
        await tx.CommitAsync();
        return ToDto(so, items);
    }
    catch 
    { 
        await tx.RollbackAsync(); 
        throw; 
    }
}


    // Mirrors reducer.js CANCEL_SO — คืนสต็อกที่จองไว้ (ถ้าเคย confirm แล้ว)
    public async Task<SalesOrderDto> CancelAsync(Guid id)
    {
        using var conn = (DbConnection)_factory.CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();
        try
        {
            var so = await conn.QuerySingleOrDefaultAsync<SalesOrder>("SELECT * FROM sales_orders WHERE id = @Id", new { Id = id }, tx)
                ?? throw new NotFoundException("SalesOrder", id);
            var items = (await conn.QueryAsync<SalesOrderItem>("SELECT * FROM sales_order_items WHERE sales_order_id = @Id", new { Id = id }, tx)).ToList();

            if (so.Status == "CONFIRMED")
            {
                foreach (var item in items)
                {
                    var remaining = item.Quantity;
                    var rows = (await conn.QueryAsync<Inventory>(
                        "SELECT * FROM inventory WHERE product_id = @ProductId AND reserved_quantity > 0",
                        new { item.ProductId }, tx)).ToList();

                    foreach (var inv in rows)
                    {
                        if (remaining <= 0) break;
                        var release = Math.Min(inv.ReservedQuantity, remaining);
                        await conn.ExecuteAsync("UPDATE inventory SET reserved_quantity = reserved_quantity - @Release, updated_at = now() WHERE id = @Id", new { Release = release, inv.Id }, tx);
                        remaining -= release;
                    }
                }
            }

            so = await conn.QuerySingleAsync<SalesOrder>("UPDATE sales_orders SET status = 'CANCELLED' WHERE id = @Id RETURNING *", new { so.Id }, tx);
            await tx.CommitAsync();
            return ToDto(so, items);
        }
        catch { await tx.RollbackAsync(); throw; }
    }

    public async Task DeleteAsync(Guid id)
    {
        using var conn = (DbConnection)_factory.CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();
        try
        {
            await conn.ExecuteAsync("DELETE FROM sales_order_items WHERE sales_order_id = @Id", new { Id = id }, tx);
            var affected = await conn.ExecuteAsync("DELETE FROM sales_orders WHERE id = @Id", new { Id = id }, tx);
            if (affected == 0) throw new NotFoundException("SalesOrder", id);
            await tx.CommitAsync();
        }
        catch { await tx.RollbackAsync(); throw; }
    }

    // Mirrors reducer.js FULFILL_SO — ตัดจากของที่จองไว้ก่อน แล้วค่อยตัดจากของว่าง คืน shortages ถ้าไม่พอ
    public async Task<FulfillSoResult> FulfillAsync(Guid id)
    {
        using var conn = (DbConnection)_factory.CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();
        try
        {
            var so = await conn.QuerySingleOrDefaultAsync<SalesOrder>("SELECT * FROM sales_orders WHERE id = @Id", new { Id = id }, tx)
                ?? throw new NotFoundException("SalesOrder", id);
            var items = (await conn.QueryAsync<SalesOrderItem>("SELECT * FROM sales_order_items WHERE sales_order_id = @Id", new { Id = id }, tx)).ToList();

            var shortages = new List<Guid>();

            foreach (var item in items)
            {
                var remaining = item.Quantity;

                var reservedRows = (await conn.QueryAsync<Inventory>(
                    "SELECT * FROM inventory WHERE product_id = @ProductId AND reserved_quantity > 0 ORDER BY reserved_quantity DESC",
                    new { item.ProductId }, tx)).ToList();

                foreach (var inv in reservedRows)
                {
                    if (remaining <= 0) break;
                    var take = new[] { inv.ReservedQuantity, inv.Quantity, remaining }.Min();
                    if (take > 0)
                    {
                        await conn.ExecuteAsync("UPDATE inventory SET reserved_quantity = reserved_quantity - @Take, quantity = quantity - @Take, updated_at = now() WHERE id = @Id", new { Take = take, inv.Id }, tx);
                        await conn.ExecuteAsync(@"
                            INSERT INTO inventory_transactions (id, product_id, from_location_id, to_location_id, quantity, transaction_type, reference_type, reference_id, created_at)
                            VALUES (@TxId, @ProductId, @LocationId, NULL, @Take, 'ISSUE', 'SALES_ORDER', @SoId, now())",
                            new { TxId = Guid.NewGuid(), item.ProductId, LocationId = inv.LocationId, Take = take, SoId = so.Id }, tx);
                    }
                    remaining -= take;
                }

                if (remaining > 0)
                {
                    var availRows = (await conn.QueryAsync<Inventory>(
                        "SELECT * FROM inventory WHERE product_id = @ProductId AND (quantity - reserved_quantity) > 0",
                        new { item.ProductId }, tx)).ToList();

                    foreach (var inv in availRows)
                    {
                        if (remaining <= 0) break;
                        var available = inv.Quantity - inv.ReservedQuantity;
                        var take = Math.Min(available, remaining);
                        if (take > 0)
                        {
                            await conn.ExecuteAsync("UPDATE inventory SET quantity = quantity - @Take, updated_at = now() WHERE id = @Id", new { Take = take, inv.Id }, tx);
                            await conn.ExecuteAsync(@"
                                INSERT INTO inventory_transactions (id, product_id, from_location_id, to_location_id, quantity, transaction_type, reference_type, reference_id, created_at)
                                VALUES (@TxId, @ProductId, @LocationId, NULL, @Take, 'ISSUE', 'SALES_ORDER', @SoId, now())",
                                new { TxId = Guid.NewGuid(), item.ProductId, LocationId = inv.LocationId, Take = take, SoId = so.Id }, tx);
                        }
                        remaining -= take;
                    }
                }

                if (remaining > 0) shortages.Add(item.ProductId);
            }

            so = await conn.QuerySingleAsync<SalesOrder>("UPDATE sales_orders SET status = 'COMPLETED' WHERE id = @Id RETURNING *", new { so.Id }, tx);
            await tx.CommitAsync();
            return new FulfillSoResult(ToDto(so, items), shortages);
        }
        catch { await tx.RollbackAsync(); throw; }
    }
}
