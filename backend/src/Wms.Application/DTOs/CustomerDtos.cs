namespace Wms.Application.DTOs;

public record CustomerDto(Guid Id, string Code, string Name, string? Phone, string? Email, string? Address, bool IsActive);
public record SaveCustomerRequest(Guid? Id, string Code, string Name, string? Phone, string? Email, string? Address, bool IsActive = true);
