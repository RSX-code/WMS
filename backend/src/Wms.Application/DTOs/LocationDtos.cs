namespace Wms.Application.DTOs;

public record LocationDto(Guid Id, Guid WarehouseId, string Code, string Name, bool IsActive);
public record SaveLocationRequest(Guid? Id, Guid WarehouseId, string Code, string Name, bool IsActive = true);
