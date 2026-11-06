namespace Wms.Application.DTOs;

public record PurchaseOrderItemDto(Guid Id, Guid PurchaseOrderId, Guid ProductId, int Quantity, decimal UnitCost, int ReceivedQuantity);
public record PurchaseOrderDto(
    Guid Id, string PoNumber, Guid SupplierId, string Status,
    DateTime OrderDate, DateTime? ExpectedDate, List<PurchaseOrderItemDto> Items);

public record CreatePoItemRequest(Guid ProductId, int Quantity, decimal Price);
public record CreatePurchaseOrderRequest(Guid SupplierId, DateTime OrderDate, DateTime? ExpectedDate, List<CreatePoItemRequest> Items);

public record ReceivePoItemsRequest(Guid LocationId, Dictionary<Guid, int> Receipts);
