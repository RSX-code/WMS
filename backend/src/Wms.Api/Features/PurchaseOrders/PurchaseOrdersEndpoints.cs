using FastEndpoints;
using FluentValidation;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.PurchaseOrders;

public class ListPurchaseOrders : EndpointWithoutRequest<List<PurchaseOrderDto>>
{
    private readonly PurchaseOrderDapperRepository _repo;
    public ListPurchaseOrders(PurchaseOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Get("/purchase-orders"); AllowAnonymous(); Description(d => d.WithTags("PurchaseOrders")); }
    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.ListAsync(), cancellation: ct);
}

public class CreatePurchaseOrderValidator : Validator<CreatePurchaseOrderRequest>
{
    public CreatePurchaseOrderValidator()
    {
        RuleFor(x => x.SupplierId).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).NotEmpty();
            item.RuleFor(i => i.Quantity).GreaterThan(0);
        });
    }
}

public class CreatePurchaseOrder : Endpoint<CreatePurchaseOrderRequest, PurchaseOrderDto>
{
    private readonly PurchaseOrderDapperRepository _repo;
    public CreatePurchaseOrder(PurchaseOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/purchase-orders"); AllowAnonymous(); Description(d => d.WithTags("PurchaseOrders")); }
    public override async Task HandleAsync(CreatePurchaseOrderRequest req, CancellationToken ct) => await SendAsync(await _repo.CreateAsync(req), cancellation: ct);
}

public class PoIdRequest { public Guid Id { get; set; } }

public class MarkPoOrdered : Endpoint<PoIdRequest>
{
    private readonly PurchaseOrderDapperRepository _repo;
    public MarkPoOrdered(PurchaseOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/purchase-orders/{Id}/mark-ordered"); AllowAnonymous(); Description(d => d.WithTags("PurchaseOrders")); }
    public override async Task HandleAsync(PoIdRequest req, CancellationToken ct) { await _repo.MarkOrderedAsync(req.Id); await SendNoContentAsync(ct); }
}

public class CancelPo : Endpoint<PoIdRequest>
{
    private readonly PurchaseOrderDapperRepository _repo;
    public CancelPo(PurchaseOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/purchase-orders/{Id}/cancel"); AllowAnonymous(); Description(d => d.WithTags("PurchaseOrders")); }
    public override async Task HandleAsync(PoIdRequest req, CancellationToken ct) { await _repo.CancelAsync(req.Id); await SendNoContentAsync(ct); }
}

public class DeletePo : Endpoint<PoIdRequest>
{
    private readonly PurchaseOrderDapperRepository _repo;
    public DeletePo(PurchaseOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Delete("/purchase-orders/{Id}"); AllowAnonymous(); Description(d => d.WithTags("PurchaseOrders")); }
    public override async Task HandleAsync(PoIdRequest req, CancellationToken ct) { await _repo.DeleteAsync(req.Id); await SendNoContentAsync(ct); }
}

public class ReceivePoItemsFullRequest
{
    public Guid Id { get; set; }
    public Guid LocationId { get; set; }
    public Dictionary<Guid, int> Receipts { get; set; } = new();
}

public class ReceivePoItemsValidator : Validator<ReceivePoItemsFullRequest>
{
    public ReceivePoItemsValidator()
    {
        RuleFor(x => x.LocationId).NotEmpty();
        RuleFor(x => x.Receipts).NotEmpty();
    }
}

public class ReceivePoItems : Endpoint<ReceivePoItemsFullRequest, PurchaseOrderDto>
{
    private readonly PurchaseOrderDapperRepository _repo;
    public ReceivePoItems(PurchaseOrderDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/purchase-orders/{Id}/receive"); AllowAnonymous(); Description(d => d.WithTags("PurchaseOrders")); }
    public override async Task HandleAsync(ReceivePoItemsFullRequest req, CancellationToken ct)
        => await SendAsync(await _repo.ReceiveItemsAsync(req.Id, req.LocationId, req.Receipts), cancellation: ct);
}
