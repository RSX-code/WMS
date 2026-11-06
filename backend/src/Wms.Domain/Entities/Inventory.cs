namespace Wms.Domain.Entities;

public class Inventory
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid LocationId { get; set; }
    public int Quantity { get; set; }
    public int ReservedQuantity { get; set; }
}
