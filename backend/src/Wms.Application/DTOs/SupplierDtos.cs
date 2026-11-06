namespace Wms.Application.DTOs;

public record SupplierDto(Guid Id, string Code, string Name, string? Phone, string? Email, string? Address, bool IsActive);
public record SaveSupplierRequest(Guid? Id, string Code, string Name, string? Phone, string? Email, string? Address, bool IsActive = true);
