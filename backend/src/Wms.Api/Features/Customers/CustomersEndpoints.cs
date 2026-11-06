using FastEndpoints;
using FluentValidation;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.Customers;

public class ListCustomers : EndpointWithoutRequest<List<CustomerDto>>
{
    private readonly CustomerDapperRepository _repo;
    public ListCustomers(CustomerDapperRepository repo) => _repo = repo;
    public override void Configure() { Get("/customers"); AllowAnonymous(); Description(d => d.WithTags("Customers")); }
    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.ListAsync(), cancellation: ct);
}

public class SaveCustomerValidator : Validator<SaveCustomerRequest>
{
    public SaveCustomerValidator() { RuleFor(x => x.Code).NotEmpty().MaximumLength(30); RuleFor(x => x.Name).NotEmpty().MaximumLength(150); RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email)); }
}

public class SaveCustomer : Endpoint<SaveCustomerRequest, CustomerDto>
{
    private readonly CustomerDapperRepository _repo;
    public SaveCustomer(CustomerDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/customers"); AllowAnonymous(); Description(d => d.WithTags("Customers")); }
    public override async Task HandleAsync(SaveCustomerRequest req, CancellationToken ct) => await SendAsync(await _repo.SaveAsync(req), cancellation: ct);
}

public class DeleteCustomerRequest { public Guid Id { get; set; } }

public class DeleteCustomer : Endpoint<DeleteCustomerRequest>
{
    private readonly CustomerDapperRepository _repo;
    public DeleteCustomer(CustomerDapperRepository repo) => _repo = repo;
    public override void Configure() { Delete("/customers/{Id}"); AllowAnonymous(); Description(d => d.WithTags("Customers")); }
    public override async Task HandleAsync(DeleteCustomerRequest req, CancellationToken ct) { await _repo.DeleteAsync(req.Id); await SendNoContentAsync(ct); }
}
