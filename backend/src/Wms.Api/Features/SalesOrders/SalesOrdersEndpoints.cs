using FastEndpoints;
using FluentValidation;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.SalesOrders;

public class ListSalesOrders : EndpointWithoutRequest<List<SalesOrderDto>>
{
    private readonly SalesOrderDapperRepository _repo;
    public ListSalesOrders(SalesOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Get("/sales-orders"); AllowAnonymous(); Description(d => d.WithTags("SalesOrders")); }
    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.ListAsync(), cancellation: ct);
}

public class CreateSalesOrderValidator : Validator<CreateSalesOrderRequest>
{
    public CreateSalesOrderValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty();
            item.RuleFor(i => i.Quantity).GreaterThan(0);
        });
    }
}

// endpoint ที่ "ลูกค้าสั่งซื้อสินค้า" เรียก
public class CreateSalesOrder : Endpoint<CreateSalesOrderRequest, SalesOrderDto>
{
    private readonly SalesOrderDapperRepository _repo;
    public CreateSalesOrder(SalesOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/sales-orders"); AllowAnonymous(); Description(d => d.WithTags("SalesOrders")); }
    public override async Task HandleAsync(CreateSalesOrderRequest req, CancellationToken ct) => await SendAsync(await _repo.CreateAsync(req), cancellation: ct);
}

public class SoIdRequest { public Guid Id { get; set; } }

public class ConfirmSalesOrder : EndpointWithoutRequest<SalesOrderDto>
{
    private readonly SalesOrderDapperRepository _repo;

    public ConfirmSalesOrder(SalesOrderDapperRepository repo)
        => _repo = repo;

    public override void Configure()
    {
        Post("/sales-orders/{Id}/confirm");
        AllowAnonymous();
        Description(d => d.WithTags("SalesOrders"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<Guid>("Id");

        var result = await _repo.ConfirmAsync(id);

        await SendAsync(result, cancellation: ct);
    }
}

public class CancelSalesOrder : Endpoint<SoIdRequest, SalesOrderDto>
{
    private readonly SalesOrderDapperRepository _repo;
    public CancelSalesOrder(SalesOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/sales-orders/{Id}/cancel"); AllowAnonymous(); Description(d => d.WithTags("SalesOrders")); }
    public override async Task HandleAsync(SoIdRequest req, CancellationToken ct) => await SendAsync(await _repo.CancelAsync(req.Id), cancellation: ct);
}

public class DeleteSalesOrder : Endpoint<SoIdRequest>
{
    private readonly SalesOrderDapperRepository _repo;
    public DeleteSalesOrder(SalesOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Delete("/sales-orders/{Id}"); AllowAnonymous(); Description(d => d.WithTags("SalesOrders")); }
    public override async Task HandleAsync(SoIdRequest req, CancellationToken ct) { await _repo.DeleteAsync(req.Id); await SendNoContentAsync(ct); }
}

public class FulfillSalesOrder : Endpoint<SoIdRequest, FulfillSoResult>
{
    private readonly SalesOrderDapperRepository _repo;
    public FulfillSalesOrder(SalesOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/sales-orders/{Id}/fulfill"); AllowAnonymous(); Description(d => d.WithTags("SalesOrders")); }
    public override async Task HandleAsync(SoIdRequest req, CancellationToken ct) => await SendAsync(await _repo.FulfillAsync(req.Id), cancellation: ct);
}
