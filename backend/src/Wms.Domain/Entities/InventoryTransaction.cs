namespace Wms.Domain.Entities;

public class InventoryTransaction
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public Guid? FromLocationId { get; set; }
    public Guid? ToLocationId { get; set; }
    public int Quantity { get; set; }
    public string TransactionType { get; set; } = default!;  // column ชื่อ transaction_type ตาม schema จริง
    public string ReferenceType { get; set; } = default!;
    public Guid? ReferenceId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
