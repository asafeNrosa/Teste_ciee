using CadastroCurriculos.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CadastroCurriculos.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Candidato> Candidatos => Set<Candidato>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Candidato>(e =>
        {
            e.HasIndex(c => c.Email).IsUnique();
            e.Property(c => c.DataCadastro).HasDefaultValueSql("SYSUTCDATETIME()");
        });
    }
}