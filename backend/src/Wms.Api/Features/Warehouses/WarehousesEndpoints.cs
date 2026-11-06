using FastEndpoints;
using FluentValidation;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.Warehouses;

public class ListWarehouses : EndpointWithoutRequest<List<WarehouseDto>>
{
    private readonly WarehouseDapperRepository _repo;
    public ListWarehouses(WarehouseDapperRepository repo) => _repo = repo;
    public override void Configure() { Get("/warehouses"); AllowAnonymous(); Description(d => d.WithTags("Warehouses")); }
    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.ListAsync(), cancellation: ct);
}

public class SaveWarehouseValidator : Validator<SaveWarehouseRequest>
{
    public SaveWarehouseValidator() { RuleFor(x => x.Code).NotEmpty().MaximumLength(30); RuleFor(x => x.Name).NotEmpty().MaximumLength(150); }
}

public class SaveWarehouse : Endpoint<SaveWarehouseRequest, WarehouseDto>
{
    private readonly WarehouseDapperRepository _repo;
    public SaveWarehouse(WarehouseDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/warehouses"); AllowAnonymous(); Description(d => d.WithTags("Warehouses")); }
    public override async Task HandleAsync(SaveWarehouseRequest req, CancellationToken ct) => await SendAsync(await _repo.SaveAsync(req), cancellation: ct);
}

public class DeleteWarehouseRequest { public Guid Id { get; set; } }

public class DeleteWarehouse : Endpoint<DeleteWarehouseRequest>
{
    private readonly WarehouseDapperRepository _repo;
    public DeleteWarehouse(WarehouseDapperRepository repo) => _repo = repo;
    public override void Configure() { Delete("/warehouses/{Id}"); AllowAnonymous(); Description(d => d.WithTags("Warehouses")); }
    public override async Task HandleAsync(DeleteWarehouseRequest req, CancellationToken ct) { await _repo.DeleteAsync(req.Id); await SendNoContentAsync(ct); }
}
