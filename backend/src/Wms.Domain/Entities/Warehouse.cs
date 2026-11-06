namespace Wms.Domain.Entities;

public class Warehouse
{
    public Guid Id { get; set; }
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
}
