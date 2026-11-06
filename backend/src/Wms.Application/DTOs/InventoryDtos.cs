namespace Wms.Application.DTOs;

public record InventoryDto(Guid Id, Guid ProductId, Guid LocationId, int Quantity, int ReservedQuantity);

public record AdjustStockRequest(Guid ProductId, Guid LocationId, string Dir, int Qty, string? Reason);
public record TransferStockRequest(Guid ProductId, Guid FromId, Guid ToId, int Qty);
