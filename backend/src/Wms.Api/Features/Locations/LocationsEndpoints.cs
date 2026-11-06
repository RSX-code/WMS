using FastEndpoints;
using FluentValidation;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.Locations;

public class ListLocations : EndpointWithoutRequest<List<LocationDto>>
{
    private readonly LocationDapperRepository _repo;
    public ListLocations(LocationDapperRepository repo) => _repo = repo;
    public override void Configure() { Get("/locations"); AllowAnonymous(); Description(d => d.WithTags("Locations")); }
    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.ListAsync(), cancellation: ct);
}

public class SaveLocationValidator : Validator<SaveLocationRequest>
{
    public SaveLocationValidator() { RuleFor(x => x.WarehouseId).NotEmpty(); RuleFor(x => x.Code).NotEmpty().MaximumLength(30); RuleFor(x => x.Name).NotEmpty().MaximumLength(150); }
}

public class SaveLocation : Endpoint<SaveLocationRequest, LocationDto>
{
    private readonly LocationDapperRepository _repo;
    public SaveLocation(LocationDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/locations"); AllowAnonymous(); Description(d => d.WithTags("Locations")); }
    public override async Task HandleAsync(SaveLocationRequest req, CancellationToken ct) => await SendAsync(await _repo.SaveAsync(req), cancellation: ct);
}

public class DeleteLocationRequest { public Guid Id { get; set; } }

public class DeleteLocation : Endpoint<DeleteLocationRequest>
{
    private readonly LocationDapperRepository _repo;
    public DeleteLocation(LocationDapperRepository repo) => _repo = repo;
    public override void Configure() { Delete("/locations/{Id}"); AllowAnonymous(); Description(d => d.WithTags("Locations")); }
    public override async Task HandleAsync(DeleteLocationRequest req, CancellationToken ct) { await _repo.DeleteAsync(req.Id); await SendNoContentAsync(ct); }
}
