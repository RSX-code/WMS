using FastEndpoints;
using Wms.Application.DTOs;
using Wms.Infrastructure.Dapper;

namespace Wms.Api.Features.Bootstrap;

public class GetBootstrap : EndpointWithoutRequest<BootstrapDto>
{
    private readonly BootstrapDapperRepository _repo;
    public GetBootstrap(BootstrapDapperRepository repo) => _repo = repo;

    public override void Configure()
    {
        Get("/bootstrap");
        AllowAnonymous();
        Description(d => d.WithTags("Bootstrap").WithDescription("ข้อมูลทั้งหมดในครั้งเดียว เหมาะกับตอนเปิดแอป"));
    }

    public override async Task HandleAsync(CancellationToken ct) => await SendAsync(await _repo.GetAsync(), cancellation: ct);
}
