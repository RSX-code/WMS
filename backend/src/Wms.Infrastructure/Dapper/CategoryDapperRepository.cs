using Dapper;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Application.Interfaces;
using Wms.Domain.Entities;

namespace Wms.Infrastructure.Dapper;

public class CategoryDapperRepository
{
    private readonly IDbConnectionFactory _factory;
    public CategoryDapperRepository(IDbConnectionFactory factory) => _factory = factory;

    public async Task<List<CategoryDto>> ListAsync()
    {
        using var conn = _factory.CreateConnection();
        var rows = await conn.QueryAsync<Category>("SELECT * FROM categories ORDER BY id");
        return rows.Select(c => c.ToDto()).ToList();
    }

    // Upsert: ส่ง Id มา = แก้ไข, ไม่ส่ง = สร้างใหม่ (เหมือน SAVE_CATEGORY ของ front เดิม)
    public async Task<CategoryDto> SaveAsync(SaveCategoryRequest req)
    {
        using var conn = _factory.CreateConnection();

        if (req.Id is Guid id)
        {
            const string sql = @"
                UPDATE categories SET name = @Name, description = @Description, is_active = @IsActive
                WHERE id = @Id RETURNING *";
            var updated = await conn.QuerySingleOrDefaultAsync<Category>(sql, new { req.Name, req.Description, req.IsActive, Id = id });
            if (updated is null) throw new NotFoundException("Category", id);
            return updated.ToDto();
        }
        else
        {
            const string sql = @"
                INSERT INTO categories (id, name, description, is_active, created_at)
                VALUES (@Id, @Name, @Description, @IsActive, now()) RETURNING *";
            var created = await conn.QuerySingleAsync<Category>(sql, new { Id = Guid.NewGuid(), req.Name, req.Description, req.IsActive });
            return created.ToDto();
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        using var conn = _factory.CreateConnection();
        var affected = await conn.ExecuteAsync("DELETE FROM categories WHERE id = @Id", new { Id = id });
        if (affected == 0) throw new NotFoundException("Category", id);
    }
}
