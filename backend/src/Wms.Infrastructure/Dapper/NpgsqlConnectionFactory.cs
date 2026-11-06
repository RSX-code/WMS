using System.Data;
using Npgsql;
using Wms.Application.Interfaces;

namespace Wms.Infrastructure.Dapper;

public class NpgsqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;
    public NpgsqlConnectionFactory(string connectionString) => _connectionString = connectionString;

    // คืน connection ที่ยังไม่ได้เปิด — Dapper เปิด/ปิดให้เองต่อ query
    // (ถ้าต้องการ transaction หลายคำสั่ง ให้เปิดเองแล้วส่ง connection เดิมเข้าไปแทน)
    public IDbConnection CreateConnection() => new NpgsqlConnection(_connectionString);
}
