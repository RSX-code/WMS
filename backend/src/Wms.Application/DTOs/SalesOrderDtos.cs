namespace Wms.Application.DTOs;

public record SalesOrderItemDto(Guid Id, Guid SalesOrderId, Guid ProductId, int Quantity, decimal UnitPrice);
public record SalesOrderDto(
    Guid Id, string OrderNumber, Guid CustomerId, string Status,
    DateTime OrderDate, List<SalesOrderItemDto> Items);

public record CreateSoItemRequest(Guid ProductId, int Quantity, decimal Price);
public record CreateSalesOrderRequest(Guid CustomerId, DateTime OrderDate, List<CreateSoItemRequest> Items);

public record FulfillSoResult(SalesOrderDto Order, List<Guid> Shortages);
