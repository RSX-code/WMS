using System.Data;

namespace Wms.Application.Interfaces;

// แยก interface นี้ออกจาก IAppDbContext เพราะ Dapper ทำงานกับ IDbConnection
// ดิบๆ ไม่ผ่าน EF Core — Application layer ยังคงไม่รู้จัก Npgsql โดยตรง
public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
