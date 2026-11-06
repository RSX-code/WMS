using System.Data.Common;
using Dapper;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Application.Interfaces;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Dapper;

public class PurchaseOrderDapperRepository
{
    private readonly IDbConnectionFactory _factory;
    public PurchaseOrderDapperRepository(IDbConnectionFactory factory) => _factory = factory;

    private static PurchaseOrderDto ToDto(PurchaseOrder po, List<PurchaseOrderItem> items) => new(
        po.Id, po.PoNumber, po.SupplierId, po.Status, po.OrderDate, po.ExpectedDate,
        items.Select(i => i.ToDto()).ToList());

    public async Task<List<PurchaseOrderDto>> ListAsync()
    {
        using var conn = _factory.CreateConnection();
        var orders = (await conn.QueryAsync<PurchaseOrder>("SELECT * FROM purchase_orders ORDER BY created_at")).ToList();
        var items = (await conn.QueryAsync<PurchaseOrderItem>("SELECT * FROM purchase_order_items")).ToList();
        return orders.Select(po => ToDto(po, items.Where(i => i.PurchaseOrderId == po.Id).ToList())).ToList();
    }

    // Mirrors reducer.js CREATE_PO — เลข PO ใช้ running count แทน format จาก Id (Id เป็น Guid format เลขไม่ได้)
    public async Task<PurchaseOrderDto> CreateAsync(CreatePurchaseOrderRequest req)
    {
        using var conn = (DbConnection)_factory.CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();
        try
        {
            var count = await conn.ExecuteScalarAsync<long>("SELECT COUNT(*) FROM purchase_orders", transaction: tx);
            var poNumber = $"PO-{DateTime.UtcNow:yyyy}-{(count + 1):000}";
            var poId = Guid.NewGuid();

            var po = await conn.QuerySingleAsync<PurchaseOrder>(@"
                INSERT INTO purchase_orders (id, po_number, supplier_id, status, order_date, expected_date, created_at)
                VALUES (@Id, @PoNumber, @SupplierId, 'DRAFT', @OrderDate, @ExpectedDate, now())
                RETURNING *",
                new { Id = poId, PoNumber = poNumber, req.SupplierId, req.OrderDate, req.ExpectedDate }, tx);

            var items = new List<PurchaseOrderItem>();
            foreach (var it in req.Items)
            {
                var item = await conn.QuerySingleAsync<PurchaseOrderItem>(@"
                    INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, unit_cost, received_quantity)
                    VALUES (@Id, @PoId, @ProductId, @Quantity, @Price, 0) RETURNING *",
                    new { Id = Guid.NewGuid(), PoId = poId, it.ProductId, it.Quantity, it.Price }, tx);
                items.Add(item);
            }

            await tx.CommitAsync();
            return ToDto(po, items);
        }
        catch { await tx.RollbackAsync(); throw; }
    }

    public async Task MarkOrderedAsync(Guid id)
    {
        using var conn = _factory.CreateConnection();
        var affected = await conn.ExecuteAsync("UPDATE purchase_orders SET status = 'ORDERED' WHERE id = @Id", new { Id = id });
        if (affected == 0) throw new NotFoundException("PurchaseOrder", id);
    }

    public async Task CancelAsync(Guid id)
    {
        using var conn = _factory.CreateConnection();
        var affected = await conn.ExecuteAsync("UPDATE purchase_orders SET status = 'CANCELLED' WHERE id = @Id", new { Id = id });
        if (affected == 0) throw new NotFoundException("PurchaseOrder", id);
    }

    public async Task DeleteAsync(Guid id)
    {
        using var conn = (DbConnection)_factory.CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();
        try
        {
            await conn.ExecuteAsync("DELETE FROM purchase_order_items WHERE purchase_order_id = @Id", new { Id = id }, tx);
            var affected = await conn.ExecuteAsync("DELETE FROM purchase_orders WHERE id = @Id", new { Id = id }, tx);
            if (affected == 0) throw new NotFoundException("PurchaseOrder", id);
            await tx.CommitAsync();
        }
        catch { await tx.RollbackAsync(); throw; }
    }

    // Mirrors reducer.js RECEIVE_PO_ITEMS
    public async Task<PurchaseOrderDto> ReceiveItemsAsync(Guid id, Guid locationId, Dictionary<Guid, int> receipts)
    {
        using var conn = (DbConnection)_factory.CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();
        try
        {
            var po = await conn.QuerySingleOrDefaultAsync<PurchaseOrder>("SELECT * FROM purchase_orders WHERE id = @Id", new { Id = id }, tx)
                ?? throw new NotFoundException("PurchaseOrder", id);
            var items = (await conn.QueryAsync<PurchaseOrderItem>("SELECT * FROM purchase_order_items WHERE purchase_order_id = @Id", new { Id = id }, tx)).ToList();

            foreach (var (itemId, qty) in receipts)
            {
                if (qty <= 0) continue;
                var item = items.FirstOrDefault(i => i.Id == itemId) ?? throw new AppException($"Purchase order item {itemId} does not belong to this order.");

                item.ReceivedQuantity += qty;
                await conn.ExecuteAsync("UPDATE purchase_order_items SET received_quantity = @ReceivedQuantity WHERE id = @Id", new { item.ReceivedQuantity, item.Id }, tx);

                var inv = await conn.QuerySingleOrDefaultAsync<Inventory>("SELECT * FROM inventory WHERE product_id = @ProductId AND location_id = @LocationId", new { item.ProductId, LocationId = locationId }, tx);
                if (inv is not null)
                    await conn.ExecuteAsync("UPDATE inventory SET quantity = quantity + @Qty, updated_at = now() WHERE id = @Id", new { Qty = qty, inv.Id }, tx);
                else
                    await conn.ExecuteAsync("INSERT INTO inventory (id, product_id, location_id, quantity, reserved_quantity, updated_at) VALUES (@Id, @ProductId, @LocationId, @Qty, 0, now())", new { Id = Guid.NewGuid(), item.ProductId, LocationId = locationId, Qty = qty }, tx);

                await conn.ExecuteAsync(@"
                    INSERT INTO inventory_transactions (id, product_id, from_location_id, to_location_id, quantity, transaction_type, reference_type, reference_id, created_at)
                    VALUES (@TxId, @ProductId, NULL, @LocationId, @Qty, 'RECEIVE', 'PURCHASE_ORDER', @PoId, now())",
                    new { TxId = Guid.NewGuid(), item.ProductId, LocationId = locationId, Qty = qty, PoId = po.Id }, tx);
            }

            if (items.All(i => i.ReceivedQuantity >= i.Quantity))
                po = await conn.QuerySingleAsync<PurchaseOrder>("UPDATE purchase_orders SET status = 'RECEIVED' WHERE id = @Id RETURNING *", new { po.Id }, tx);

            await tx.CommitAsync();
            return ToDto(po, items);
        }
        catch { await tx.RollbackAsync(); throw; }
    }
}
