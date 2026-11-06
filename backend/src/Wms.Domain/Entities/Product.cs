namespace Wms.Domain.Entities;

public class Product
{
    public Guid Id { get; set; }
    public string Sku { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
    public Guid CategoryId { get; set; }
    public string? Barcode { get; set; }
    public string Unit { get; set; } = "PCS";
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public int MinimumStock { get; set; }
    public bool IsActive { get; set; } = true;
}
