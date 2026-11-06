namespace Wms.Application.DTOs;

public record TransactionDto(
    Guid Id, Guid ProductId, Guid? FromLocationId, Guid? ToLocationId,
    int Quantity, string Type, string ReferenceType, Guid? ReferenceId, DateTime CreatedAt);
