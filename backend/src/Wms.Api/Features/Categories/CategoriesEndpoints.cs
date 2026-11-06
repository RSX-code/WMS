using FastEndpoints;
using FluentValidation;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.Categories;

public class ListCategories : EndpointWithoutRequest<List<CategoryDto>>
{
    private readonly CategoryDapperRepository _repo;
    public ListCategories(CategoryDapperRepository repo) => _repo = repo;
    public override void Configure() { Get("/categories"); AllowAnonymous(); Description(d => d.WithTags("Categories")); }
    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.ListAsync(), cancellation: ct);
}

public class SaveCategoryValidator : Validator<SaveCategoryRequest>
{
    public SaveCategoryValidator() => RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
}

public class SaveCategory : Endpoint<SaveCategoryRequest, CategoryDto>
{
    private readonly CategoryDapperRepository _repo;
    public SaveCategory(CategoryDapperRepository repo) => _repo = repo;
    public override void Configure() { Post("/categories"); AllowAnonymous(); Description(d => d.WithTags("Categories")); }
    public override async Task HandleAsync(SaveCategoryRequest req, CancellationToken ct) => await SendAsync(await _repo.SaveAsync(req), cancellation: ct);
}

public class DeleteCategoryRequest { public Guid Id { get; set; } }

public class DeleteCategory : Endpoint<DeleteCategoryRequest>
{
    private readonly CategoryDapperRepository _repo;
    public DeleteCategory(CategoryDapperRepository repo) => _repo = repo;
    public override void Configure() { Delete("/categories/{Id}"); AllowAnonymous(); Description(d => d.WithTags("Categories")); }
    public override async Task HandleAsync(DeleteCategoryRequest req, CancellationToken ct) { await _repo.DeleteAsync(req.Id); await SendNoContentAsync(ct); }
}
