namespace Wms.Application.DTOs;

public record WarehouseDto(Guid Id, string Code, string Name, string? Address, bool IsActive);
public record SaveWarehouseRequest(Guid? Id, string Code, string Name, string? Address, bool IsActive = true);
