namespace Wms.Application.DTOs;

public record ProductDto(
    Guid Id, string Sku, string Name, string? Description, Guid CategoryId,
    string? Barcode, string Unit, decimal CostPrice, decimal SellingPrice,
    int MinimumStock, bool IsActive);

public record SaveProductRequest(
    Guid? Id, string Sku, string Name, string? Description, Guid CategoryId,
    string? Barcode, string Unit, decimal CostPrice, decimal SellingPrice,
    int MinimumStock, bool IsActive = true);
