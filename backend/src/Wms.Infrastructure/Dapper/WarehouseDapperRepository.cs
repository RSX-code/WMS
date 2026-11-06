using Dapper;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Application.Interfaces;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Dapper;

public class WarehouseDapperRepository
{
    private readonly IDbConnectionFactory _factory;
    public WarehouseDapperRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<WarehouseDto>> ListAsync()
    {
        using var conn = _factory.CreateConnection();
        var rows = await conn.QueryAsync<Warehouse>("SELECT * FROM warehouses ORDER BY id");
        var result = rows.Select(w => w.ToDto()).ToList();
        return result;
    }

    public async Task<WarehouseDto> SaveAsync(SaveWarehouseRequest req)
    {
        using var conn = _factory.CreateConnection();

        if (req.Id is Guid id)
        {
            const string sql = @"
                UPDATE warehouses SET code = @Code, name = @Name, address = @Address, is_active = @IsActive
                WHERE id = @Id RETURNING *";
            var updated = await conn.QuerySingleOrDefaultAsync<Warehouse>(sql, new { req.Code, req.Name, req.Address, req.IsActive, Id = id });
            if (updated is null) throw new NotFoundException("Warehouse", id);
            return updated.ToDto();
        }
        else
        {
            const string sql = @"
                INSERT INTO warehouses (id, code, name, address, is_active, created_at)
                VALUES (@Id, @Code, @Name, @Address, @IsActive, now()) RETURNING *";
            var created = await conn.QuerySingleAsync<Warehouse>(sql, new { Id = Guid.NewGuid(), req.Code, req.Name, req.Address, req.IsActive });
            return created.ToDto();
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        using var conn = _factory.CreateConnection();
        var affected = await conn.ExecuteAsync("DELETE FROM warehouses WHERE id = @Id", new { Id = id });
        if (affected == 0) throw new NotFoundException("Warehouse", id);
    }
}
