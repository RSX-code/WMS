using Dapper;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Application.Interfaces;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Dapper;

public class CustomerDapperRepository
{
    private readonly IDbConnectionFactory _factory;
    public CustomerDapperRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<CustomerDto>> ListAsync()
    {
        using var conn = _factory.CreateConnection();
        var rows = await conn.QueryAsync<Customer>("SELECT * FROM customers ORDER BY id");
        return rows.Select(c => c.ToDto()).ToList();
    }

    public async Task<CustomerDto> SaveAsync(SaveCustomerRequest req)
    {
        using var conn = _factory.CreateConnection();

        if (req.Id is Guid id)
        {
            const string sql = @"
                UPDATE customers SET code = @Code, name = @Name, phone = @Phone, email = @Email, address = @Address
                WHERE id = @Id RETURNING *";
            var updated = await conn.QuerySingleOrDefaultAsync<Customer>(sql, new { req.Code, req.Name, req.Phone, req.Email, req.Address, Id = id });
            if (updated is null) throw new NotFoundException("Customer", id);
            return updated.ToDto();
        }
        else
        {
            const string sql = @"
                INSERT INTO customers (id, code, name, phone, email, address, created_at)
                VALUES (@Id, @Code, @Name, @Phone, @Email, @Address, now()) RETURNING *";
            var created = await conn.QuerySingleAsync<Customer>(sql, new { Id = Guid.NewGuid(), req.Code, req.Name, req.Phone, req.Email, req.Address });
            return created.ToDto();
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        using var conn = _factory.CreateConnection();
        var affected = await conn.ExecuteAsync("DELETE FROM customers WHERE id = @Id", new { Id = id });
        if (affected == 0) throw new NotFoundException("Customer", id);
    }
}