using FastEndpoints;
using FluentValidation;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.Suppliers;

public class ListSuppliers : EndpointWithoutRequest<List<SupplierDto>>
{
    private readonly SupplierDapperRepository _repo;
    public ListSuppliers(SupplierDapperRepository repo) => _repo = repo;
    public override void Configure() { Get("/suppliers"); AllowAnonymous(); Description(d => d.WithTags("Suppliers")); }
    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.ListAsync(), cancellation: ct);
}

public class SaveSupplierValidator : Validator<SaveSupplierRequest>
{
    public SaveSupplierValidator() { RuleFor(x => x.Code).NotEmpty().MaximumLength(30); RuleFor(x => x.Name).NotEmpty().MaximumLength(150); RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email)); }
}

public class SaveSupplier : Endpoint<SaveSupplierRequest, SupplierDto>
{
    private readonly SupplierDapperRepository _repo;
    public SaveSupplier(SupplierDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/suppliers"); AllowAnonymous(); Description(d => d.WithTags("Suppliers")); }
    public override async Task HandleAsync(SaveSupplierRequest req, CancellationToken ct) => await SendAsync(await _repo.SaveAsync(req), cancellation: ct);
}

public class DeleteSupplierRequest { public Guid Id { get; set; } }

public class DeleteSupplier : Endpoint<DeleteSupplierRequest>
{
    private readonly SupplierDapperRepository _repo;
    public DeleteSupplier(SupplierDapperRepository repo) => _repo = repo;
    public override void Configure() { Delete("/suppliers/{Id}"); AllowAnonymous(); Description(d => d.WithTags("Suppliers")); }
    public override async Task HandleAsync(DeleteSupplierRequest req, CancellationToken ct) { await _repo.DeleteAsync(req.Id); await SendNoContentAsync(ct); }
}
