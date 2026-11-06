using System.Data.Common;
using Dapper;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Application.Interfaces;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Dapper;

public class InventoryDapperRepository
{
    private readonly IDbConnectionFactory _factory;
    public InventoryDapperRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<InventoryDto>> ListAsync()
    {
        using var conn = _factory.CreateConnection();
        var rows = await conn.QueryAsync<Inventory>("SELECT * FROM inventory ORDER BY id");
        return rows.Select(i => i.ToDto()).ToList();
    }

    public async Task<List<TransactionDto>> ListTransactionsAsync()
    {
        using var conn = _factory.CreateConnection();
        var rows = await conn.QueryAsync<InventoryTransaction>("SELECT * FROM inventory_transactions ORDER BY created_at DESC");
        return rows.Select(t => t.ToDto()).ToList();
    }

    // Mirrors reducer.js ADJUST_STOCK
    public async Task<InventoryDto> AdjustAsync(AdjustStockRequest req)
    {
        using var conn = (DbConnection)_factory.CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();
        try
        {
            var existing = await conn.QuerySingleOrDefaultAsync<Inventory>(
                "SELECT * FROM inventory WHERE product_id = @ProductId AND location_id = @LocationId",
                new { req.ProductId, req.LocationId }, tx);

            Inventory result;
            if (req.Dir == "decrease")
            {
                if (existing is null) throw new AppException("No stock found at this location to decrease.");
                if (existing.Quantity - req.Qty < 0) throw new AppException("Not enough stock at this location.");

                result = await conn.QuerySingleAsync<Inventory>(
                    "UPDATE inventory SET quantity = quantity - @Qty, updated_at = now() WHERE id = @Id RETURNING *",
                    new { req.Qty, existing.Id }, tx);

                await conn.ExecuteAsync(@"
                    INSERT INTO inventory_transactions (id, product_id, from_location_id, to_location_id, quantity, transaction_type, reference_type, created_at)
                    VALUES (@TxId, @ProductId, @LocationId, NULL, @Qty, 'ADJUST', @Reason, now())",
                    new { TxId = Guid.NewGuid(), req.ProductId, req.LocationId, req.Qty, Reason = req.Reason ?? "ADJUSTMENT" }, tx);
            }
            else
            {
                if (existing is not null)
                {
                    result = await conn.QuerySingleAsync<Inventory>("UPDATE inventory SET quantity = quantity + @Qty, updated_at = now() WHERE id = @Id RETURNING *", new { req.Qty, existing.Id }, tx);
                }
                else
                {
                    result = await conn.QuerySingleAsync<Inventory>(
                        "INSERT INTO inventory (id, product_id, location_id, quantity, reserved_quantity, updated_at) VALUES (@Id, @ProductId, @LocationId, @Qty, 0, now()) RETURNING *",
                        new { Id = Guid.NewGuid(), req.ProductId, req.LocationId, req.Qty }, tx);
                }

                await conn.ExecuteAsync(@"
                    INSERT INTO inventory_transactions (id, product_id, from_location_id, to_location_id, quantity, transaction_type, reference_type, created_at)
                    VALUES (@TxId, @ProductId, NULL, @LocationId, @Qty, 'ADJUST', @Reason, now())",
                    new { TxId = Guid.NewGuid(), req.ProductId, req.LocationId, req.Qty, Reason = req.Reason ?? "ADJUSTMENT" }, tx);
            }

            await tx.CommitAsync();
            return result.ToDto();
        }
        catch { await tx.RollbackAsync(); throw; }
    }

    // Mirrors reducer.js TRANSFER_STOCK
    public async Task TransferAsync(TransferStockRequest req)
    {
        using var conn = (DbConnection)_factory.CreateConnection();
        await conn.OpenAsync();
        using var tx = await conn.BeginTransactionAsync();
        try
        {
            var fromInv = await conn.QuerySingleOrDefaultAsync<Inventory>(
                "SELECT * FROM inventory WHERE product_id = @ProductId AND location_id = @FromId",
                new { req.ProductId, req.FromId }, tx)
                ?? throw new AppException("Source location has no stock for this product.");

            if (fromInv.Quantity - req.Qty < 0) throw new AppException("Not enough stock at the source location.");

            await conn.ExecuteAsync("UPDATE inventory SET quantity = quantity - @Qty, updated_at = now() WHERE id = @Id", new { req.Qty, fromInv.Id }, tx);

            var toInv = await conn.QuerySingleOrDefaultAsync<Inventory>(
                "SELECT * FROM inventory WHERE product_id = @ProductId AND location_id = @ToId",
                new { req.ProductId, req.ToId }, tx);

            if (toInv is not null)
                await conn.ExecuteAsync("UPDATE inventory SET quantity = quantity + @Qty, updated_at = now() WHERE id = @Id", new { req.Qty, toInv.Id }, tx);
            else
                await conn.ExecuteAsync("INSERT INTO inventory (id, product_id, location_id, quantity, reserved_quantity, updated_at) VALUES (@Id, @ProductId, @ToId, @Qty, 0, now())", new { Id = Guid.NewGuid(), req.ProductId, req.ToId, req.Qty }, tx);

            await conn.ExecuteAsync(@"
                INSERT INTO inventory_transactions (id, product_id, from_location_id, to_location_id, quantity, transaction_type, reference_type, created_at)
                VALUES (@TxId, @ProductId, @FromId, @ToId, @Qty, 'TRANSFER', 'MANUAL', now())",
                new { TxId = Guid.NewGuid(), req.ProductId, req.FromId, req.ToId, req.Qty }, tx);

            await tx.CommitAsync();
        }
        catch { await tx.RollbackAsync(); throw; }
    }
}
