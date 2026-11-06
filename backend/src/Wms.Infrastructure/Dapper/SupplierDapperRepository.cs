using Dapper;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Application.Interfaces;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Dapper;

public class SupplierDapperRepository
{
    private readonly IDbConnectionFactory _factory;
    public SupplierDapperRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<SupplierDto>> ListAsync()
    {
        using var conn = _factory.CreateConnection();
        var rows = await conn.QueryAsync<Supplier>("SELECT * FROM suppliers ORDER BY id");
        return rows.Select(s => s.ToDto()).ToList();
    }

    public async Task<SupplierDto> SaveAsync(SaveSupplierRequest req)
    {
        using var conn = _factory.CreateConnection();

        if (req.Id is Guid id)
        {
            const string sql = @"
                UPDATE suppliers SET code = @Code, name = @Name, phone = @Phone, email = @Email, address = @Address
                WHERE id = @Id RETURNING *";
            var updated = await conn.QuerySingleOrDefaultAsync<Supplier>(sql, new { req.Code, req.Name, req.Phone, req.Email, req.Address, Id = id });
            if (updated is null) throw new NotFoundException("Supplier", id);
            return updated.ToDto();
        }
        else
        {
            const string sql = @"
                INSERT INTO suppliers (id, code, name, phone, email, address, created_at)
                VALUES (@Id, @Code, @Name, @Phone, @Email, @Address, now()) RETURNING *";
            var created = await conn.QuerySingleAsync<Supplier>(sql, new { Id = Guid.NewGuid(), req.Code, req.Name, req.Phone, req.Email, req.Address });
            return created.ToDto();
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        using var conn = _factory.CreateConnection();
        var affected = await conn.ExecuteAsync("DELETE FROM suppliers WHERE id = @Id", new { Id = id });
        if (affected == 0) throw new NotFoundException("Supplier", id);
    }
}
