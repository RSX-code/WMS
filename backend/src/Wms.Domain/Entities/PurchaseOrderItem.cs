namespace Wms.Domain.Entities;

public class PurchaseOrderItem
{
    public Guid Id { get; set; }
    public Guid PurchaseOrderId { get; set; }
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitCost { get; set; }
    public int ReceivedQuantity { get; set; }
}
