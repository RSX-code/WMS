using FastEndpoints;
using FluentValidation;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.Inventory;

public class ListInventory : EndpointWithoutRequest<List<InventoryDto>>
{
    private readonly InventoryDapperRepository _repo;
    public ListInventory(InventoryDapperRepository repo) => _repo = repo;
    public override void Configure() { Get("/inventory"); AllowAnonymous(); Description(d => d.WithTags("Inventory")); }
    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.ListAsync(), cancellation: ct);
}

public class ListTransactions : EndpointWithoutRequest<List<TransactionDto>>
{
    private readonly InventoryDapperRepository _repo;
    public ListTransactions(InventoryDapperRepository repo) => _repo = repo;
    public override void Configure() { Get("/inventory/transactions"); AllowAnonymous(); Description(d => d.WithTags("Inventory")); }
    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.ListTransactionsAsync(), cancellation: ct);
}

public class AdjustStockValidator : Validator<AdjustStockRequest>
{
    public AdjustStockValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.LocationId).NotEmpty();
        RuleFor(x => x.Qty).GreaterThan(0);
        RuleFor(x => x.Dir).Must(d => d == "increase" || d == "decrease");
    }
}

public class AdjustStock : Endpoint<AdjustStockRequest, InventoryDto>
{
    private readonly InventoryDapperRepository _repo;
    public AdjustStock(InventoryDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/inventory/adjust"); AllowAnonymous(); Description(d => d.WithTags("Inventory")); }
    public override async Task HandleAsync(AdjustStockRequest req, CancellationToken ct) => await SendAsync(await _repo.AdjustAsync(req), cancellation: ct);
}

public class TransferStockValidator : Validator<TransferStockRequest>
{
    public TransferStockValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.FromId).NotEmpty();
        RuleFor(x => x.ToId).NotEmpty();
        RuleFor(x => x.Qty).GreaterThan(0);
        RuleFor(x => x).Must(x => x.FromId != x.ToId);
    }
}

public class TransferStock : Endpoint<TransferStockRequest>
{
    private readonly InventoryDapperRepository _repo;
    public TransferStock(InventoryDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/inventory/transfer"); AllowAnonymous(); Description(d => d.WithTags("Inventory")); }
    public override async Task HandleAsync(TransferStockRequest req, CancellationToken ct) { await _repo.TransferAsync(req); await SendNoContentAsync(ct); }
}
