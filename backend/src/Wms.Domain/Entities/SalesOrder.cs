namespace Wms.Domain.Entities;

public class SalesOrder
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = default!;
    public Guid CustomerId { get; set; }
    public string Status { get; set; } = "DRAFT";
    public DateTime OrderDate { get; set; }
}
