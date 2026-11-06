using FastEndpoints;
using FluentValidation;
using Wms.Application.Common;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.Products;

// GET /products — endpoint หลักที่ front เรียกเพื่อโหลดรายการสินค้า
public class ListProducts : EndpointWithoutRequest<List<ProductDto>>
{
    private readonly ProductDapperRepository _repo;
    public ListProducts(ProductDapperRepository repo) => _repo = repo;

    public override void Configure()
    {
        Get("/products");
        AllowAnonymous();
        Description(d => d.WithTags("Products"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var products = await _repo.GetAllAsync();
        await SendAsync(products.Select(p => p.ToDto()).ToList(), cancellation: ct);
    }
}

// endpoint สำหรับทดสอบว่า Dapper เชื่อมต่อ PostgreSQL ได้จริง — แยกจาก
// ProductsEndpoints.cs (ที่ใช้ EF Core) เพื่อให้เห็นชัดว่าใช้กันคนละทาง
// ทดสอบได้ที่ Swagger: GET /api/dapper/products

public class ListProductsDapper : EndpointWithoutRequest<IEnumerable<object>>
{
    private readonly ProductDapperRepository _repo;
    public ListProductsDapper(ProductDapperRepository repo) => _repo = repo;

    public override void Configure()
    {
        Get("/dapper/products");
        AllowAnonymous();
        Description(d => d.WithTags("Dapper Demo").WithDescription("ดึงสินค้าทั้งหมดผ่าน Dapper ล้วนๆ (ไม่ผ่าน EF Core)"));
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await SendAsync(await _repo.GetAllAsync(), cancellation: ct);
}

public class ListProductsWithCategoryDapper : EndpointWithoutRequest<IEnumerable<object>>
{
    private readonly ProductDapperRepository _repo;
    public ListProductsWithCategoryDapper(ProductDapperRepository repo) => _repo = repo;

    public override void Configure()
    {
        Get("/dapper/products/with-category");
        AllowAnonymous();
        Description(d => d.WithTags("Dapper Demo").WithDescription("ตัวอย่าง JOIN ข้ามตารางด้วย Dapper"));
    }

    public override async Task HandleAsync(CancellationToken ct)
        => await SendAsync(await _repo.GetWithCategoryAsync(), cancellation: ct);
}

public class LowStockReportRequest { public Guid WarehouseId { get; set; } }

public class LowStockReportDapper : Endpoint<LowStockReportRequest, IEnumerable<object>>
{
    private readonly ProductDapperRepository _repo;
    public LowStockReportDapper(ProductDapperRepository repo) => _repo = repo;

    public override void Configure()
    {
        Get("/dapper/products/low-stock/{WarehouseId}");
        AllowAnonymous();
        Description(d => d.WithTags("Dapper Demo").WithDescription("ตัวอย่างรายงาน GROUP BY + HAVING ด้วย Dapper"));
    }

    public override async Task HandleAsync(LowStockReportRequest req, CancellationToken ct)
        => await SendAsync(await _repo.GetLowStockReportAsync(req.WarehouseId), cancellation: ct);
}

public class GetProductByBarcode : EndpointWithoutRequest<Wms.Application.DTOs.ProductDto>
{
    private readonly ProductDapperRepository _repo;
    public GetProductByBarcode(ProductDapperRepository repo) => _repo = repo;

    public override void Configure()
    {
        Get("/products/barcode/{Barcode}");
        AllowAnonymous();
        Description(d => d.WithTags("Products").WithDescription("ค้นหาสินค้าด้วยบาร์โค้ด"));
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var barcode = Route<string>("Barcode");
        var product = await _repo.GetByBarcodeAsync(barcode);
        if (product is null)
        {
            await SendNotFoundAsync(ct);
            return;
        }
        await SendAsync(product.ToDto(), cancellation: ct);
    }
}

public class SaveProductValidator : FastEndpoints.Validator<Wms.Application.DTOs.SaveProductRequest>
{
    public SaveProductValidator()
    {
        RuleFor(x => x.Sku).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.CostPrice).GreaterThanOrEqualTo(0);
        RuleFor(x => x.SellingPrice).GreaterThanOrEqualTo(0);
    }
}

// endpoint ที่ปุ่ม "เพิ่มสินค้า" ของ front ต้องเรียก — upsert (มี Id = แก้, ไม่มี = สร้างใหม่)
public class SaveProductDapper : Endpoint<Wms.Application.DTOs.SaveProductRequest, Wms.Domain.Entities.Product>
{
    private readonly ProductDapperRepository _repo;
    public SaveProductDapper(ProductDapperRepository repo) => _repo = repo;

    public override void Configure()
    {
        Post("/products");
        AllowAnonymous();
        Description(d => d.WithTags("Products").WithDescription("เพิ่ม/แก้ไขสินค้า (ผ่าน Dapper)"));
    }

    public override async Task HandleAsync(Wms.Application.DTOs.SaveProductRequest req, CancellationToken ct)
        => await SendAsync(await _repo.SaveAsync(req), cancellation: ct);
}

public class DeleteProductRequest { public Guid Id { get; set; } }

public class DeleteProductDapper : Endpoint<DeleteProductRequest>
{
    private readonly ProductDapperRepository _repo;
    public DeleteProductDapper(ProductDapperRepository repo) => _repo = repo;

    public override void Configure()
    {
        Delete("/products/{Id}");
        AllowAnonymous();
        Description(d => d.WithTags("Products"));
    }

    public override async Task HandleAsync(DeleteProductRequest req, CancellationToken ct)
    {
        await _repo.DeleteAsync(req.Id);
        await SendNoContentAsync(ct);
    }
}