namespace Wms.Application.Common;

// Thrown for business-rule violations (e.g. not enough stock, invalid status
// transition). Mapped to HTTP 400 by the API layer. Use NotFoundException for 404s.
public class AppException : Exception
{
    public AppException(string message) : base(message) { }
}

public class NotFoundException : Exception
{
    public NotFoundException(string entity, object id) : base($"{entity} with id '{id}' was not found.") { }
}
