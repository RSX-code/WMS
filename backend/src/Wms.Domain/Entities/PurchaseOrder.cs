namespace Wms.Domain.Entities;

public class PurchaseOrder
{
    public Guid Id { get; set; }
    public string PoNumber { get; set; } = default!;
    public Guid SupplierId { get; set; }
    public string Status { get; set; } = "DRAFT";
    public DateTime OrderDate { get; set; }
    public DateTime? ExpectedDate { get; set; }
}
