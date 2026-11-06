namespace Wms.Application.DTOs;

public record CategoryDto(Guid Id, string Name, string? Description, bool IsActive);
public record SaveCategoryRequest(Guid? Id, string Name, string? Description, bool IsActive = true);
