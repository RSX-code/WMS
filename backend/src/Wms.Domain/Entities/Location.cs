namespace Wms.Domain.Entities;

public class Location
{
    public Guid Id { get; set; }
    public Guid WarehouseId { get; set; }
    public string Code { get; set; } = default!;
    public string Name { get; set; } = default!;
    public bool IsActive { get; set; } = true;
}
