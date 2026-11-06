using Dapper;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Application.Interfaces;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Dapper;

public class LocationDapperRepository
{
    private readonly IDbConnectionFactory _factory;
    public LocationDapperRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<LocationDto>> ListAsync()
    {
        using var conn = _factory.CreateConnection();
        var rows = await conn.QueryAsync<Location>("SELECT * FROM locations ORDER BY id");
        return rows.Select(l => l.ToDto()).ToList();
    }

    public async Task<LocationDto> SaveAsync(SaveLocationRequest req)
    {
        using var conn = _factory.CreateConnection();

        if (req.Id is Guid id)
        {
            const string sql = @"
                UPDATE locations SET warehouse_id = @WarehouseId, code = @Code, name = @Name, is_active = @IsActive
                WHERE id = @Id RETURNING *";
            var updated = await conn.QuerySingleOrDefaultAsync<Location>(sql, new { req.WarehouseId, req.Code, req.Name, req.IsActive, Id = id });
            if (updated is null) throw new NotFoundException("Location", id);
            return updated.ToDto();
        }
        else
        {
            const string sql = @"
                INSERT INTO locations (id, warehouse_id, code, name, is_active, created_at)
                VALUES (@Id, @WarehouseId, @Code, @Name, @IsActive, now()) RETURNING *";
            var created = await conn.QuerySingleAsync<Location>(sql, new { Id = Guid.NewGuid(), req.WarehouseId, req.Code, req.Name, req.IsActive });
            return created.ToDto();
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        using var conn = _factory.CreateConnection();
        var affected = await conn.ExecuteAsync("DELETE FROM locations WHERE id = @Id", new { Id = id });
        if (affected == 0) throw new NotFoundException("Location", id);
    }
}
