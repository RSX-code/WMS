using DotNetEnv;
using FastEndpoints;
using FastEndpoints.Swagger;
using Wms.Application.Interfaces;
using Wms.Infrastructure.Dapper;

// ต้องโหลด .env ก่อน CreateBuilder เสมอ — builder จะ snapshot ค่า
// environment variables ตอนสร้าง ถ้าโหลดทีหลังจะไม่ทันค่า .env
// .env อยู่ที่ repo root (ข้าง docker-compose.yml) ไม่ใช่ใน src/Wms.Api
// TraversePath() จะไล่หาไฟล์ .env จากโฟลเดอร์นี้ขึ้นไปเรื่อยๆ จนกว่าจะเจอ
Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// ---------- Services ----------
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

// ---------- Dapper ล้วนๆ — ไม่มี EF Core, ไม่ migrate, ไม่แตะ schema ----------
// database มีข้อมูลอยู่แล้วและจัดการเองผ่าน DBeaver ภายนอก
Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true; // จับคู่ column snake_case กับ C# PascalCase อัตโนมัติ
builder.Services.AddSingleton<IDbConnectionFactory>(_ => new NpgsqlConnectionFactory(connectionString));
builder.Services.AddScoped<CategoryDapperRepository>();
builder.Services.AddScoped<ProductDapperRepository>();
builder.Services.AddScoped<WarehouseDapperRepository>();
builder.Services.AddScoped<LocationDapperRepository>();
builder.Services.AddScoped<SupplierDapperRepository>();
builder.Services.AddScoped<CustomerDapperRepository>();
builder.Services.AddScoped<InventoryDapperRepository>();
builder.Services.AddScoped<PurchaseOrderDapperRepository>();
builder.Services.AddScoped<SalesOrderDapperRepository>();
builder.Services.AddScoped<BootstrapDapperRepository>();

var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddFastEndpoints();
builder.Services.SwaggerDocument(o =>
{
    o.DocumentSettings = s =>
    {
        s.Title = "WMS API (Dapper)";
        s.Version = "v1";
        s.Description = "Warehouse Management System API — Dapper + PostgreSQL, ไม่ใช้ EF Core";
    };
});

var app = builder.Build();

app.UseCors("Frontend");

app.UseFastEndpoints(c =>
{
    c.Endpoints.RoutePrefix = "api";
    c.Serializer.Options.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});
app.UseSwaggerGen();

app.Run();
