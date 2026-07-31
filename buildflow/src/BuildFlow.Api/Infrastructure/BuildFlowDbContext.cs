using BuildFlow.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace BuildFlow.Api.Infrastructure;

public sealed class BuildFlowDbContext(DbContextOptions<BuildFlowDbContext> options) : DbContext(options)
{
    public DbSet<ApplicationUser> Users => Set<ApplicationUser>();
    public DbSet<ConstructionProject> Projects => Set<ConstructionProject>();
    public DbSet<ProjectDocument> Documents => Set<ProjectDocument>();
    public DbSet<DocumentVersion> DocumentVersions => Set<DocumentVersion>();
    public DbSet<ApprovalRequest> Approvals => Set<ApprovalRequest>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<ApplicationUser>().HasIndex(user => user.Email).IsUnique();
        builder.Entity<ConstructionProject>().Property(project => project.Name).HasMaxLength(180);
        builder.Entity<ProjectDocument>().HasOne(document => document.Project).WithMany(project => project.Documents)
            .HasForeignKey(document => document.ProjectId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<DocumentVersion>().HasOne(version => version.Document).WithMany(document => document.Versions)
            .HasForeignKey(version => version.DocumentId).OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ApprovalRequest>().HasOne(request => request.Document).WithMany(document => document.Approvals)
            .HasForeignKey(request => request.DocumentId).OnDelete(DeleteBehavior.Cascade);
    }
}
