using System.Security.Claims;
using System.Text;
using BuildFlow.Api.Contracts;
using BuildFlow.Api.Domain;
using BuildFlow.Api.Infrastructure;
using BuildFlow.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

builder.Services.AddDbContext<BuildFlowDbContext>(options =>
    options.UseNpgsql(configuration.GetConnectionString("BuildFlow")));
builder.Services.AddScoped<PasswordHasher<ApplicationUser>>();
builder.Services.AddScoped<AuthTokenService>();
builder.Services.AddScoped<BlobDocumentStorage>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(configuration["Cors:Origin"] ?? "http://localhost:5173")
    .AllowAnyHeader().AllowAnyMethod()));

var jwtKey = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is required.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = configuration["Jwt:Issuer"],
        ValidateAudience = true, ValidAudience = configuration["Jwt:Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateLifetime = true
    };
});
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanApprove", policy => policy.RequireRole(UserRole.Admin.ToString(), UserRole.Director.ToString()));
    options.AddPolicy("CanEdit", policy => policy.RequireRole(UserRole.Admin.ToString(), UserRole.Director.ToString(), UserRole.Architect.ToString()));
});

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BuildFlowDbContext>();
    await db.Database.EnsureCreatedAsync();
    if (!await db.Users.AnyAsync())
    {
        var hasher = scope.ServiceProvider.GetRequiredService<PasswordHasher<ApplicationUser>>();
        var director = new ApplicationUser { Email = "director@buildflow.local", DisplayName = "Demo Director", Role = UserRole.Director };
        director.PasswordHash = hasher.HashPassword(director, "BuildFlow!2026");
        db.Users.Add(director);
        await db.SaveChangesAsync();
    }
}

app.MapGet("/health", async (BuildFlowDbContext db) => new
{
    status = "ok",
    service = "buildflow-api",
    projects = await db.Projects.CountAsync(),
    documents = await db.Documents.CountAsync()
});

var auth = app.MapGroup("/api/auth");
auth.MapPost("/login", async (LoginRequest request, BuildFlowDbContext db, PasswordHasher<ApplicationUser> hasher, AuthTokenService tokens) =>
{
    var user = await db.Users.SingleOrDefaultAsync(item => item.Email == request.Email.ToLowerInvariant());
    if (user is null || hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
        return Results.Unauthorized();
    return Results.Ok(new LoginResponse(tokens.Create(user), user.DisplayName, user.Role.ToString()));
});

var projects = app.MapGroup("/api/projects").RequireAuthorization();
projects.MapGet("/", async (BuildFlowDbContext db) => await db.Projects.AsNoTracking()
    .OrderByDescending(project => project.CreatedAt)
    .Select(project => new ProjectResponse(project.Id, project.Name, project.ClientName, project.Address, project.Status, project.Documents.Count))
    .ToListAsync());

projects.MapPost("/", async (CreateProjectRequest request, BuildFlowDbContext db, ClaimsPrincipal user) =>
{
    var project = new ConstructionProject { Name = request.Name.Trim(), ClientName = request.ClientName.Trim(), Address = request.Address.Trim(), Status = request.Status };
    db.Projects.Add(project);
    await WriteAudit(db, user, "created", "project", project.Id, $"Created {project.Name}");
    await db.SaveChangesAsync();
    return Results.Created($"/api/projects/{project.Id}", new ProjectResponse(project.Id, project.Name, project.ClientName, project.Address, project.Status, 0));
}).RequireAuthorization("CanEdit");

projects.MapPatch("/{projectId:guid}/status", async (Guid projectId, UpdateProjectStatusRequest request, BuildFlowDbContext db, ClaimsPrincipal user) =>
{
    var project = await db.Projects.FindAsync(projectId);
    if (project is null) return Results.NotFound();
    project.Status = request.Status;
    await WriteAudit(db, user, "updated", "project", project.Id, $"Changed {project.Name} to {project.Status}");
    await db.SaveChangesAsync();
    return Results.NoContent();
}).RequireAuthorization("CanEdit");

projects.MapPost("/{projectId:guid}/documents", async (Guid projectId, IFormFile file, string title, string documentType, BuildFlowDbContext db, BlobDocumentStorage storage, ClaimsPrincipal user) =>
{
    var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png" };
    if (file.Length == 0 || file.Length > 30 * 1024 * 1024 || !allowedTypes.Contains(file.ContentType))
        return Results.BadRequest("Upload a PDF, JPG, or PNG smaller than 30 MB.");
    var project = await db.Projects.FindAsync(projectId);
    if (project is null) return Results.NotFound();
    var document = new ProjectDocument { ProjectId = projectId, Title = title.Trim(), DocumentType = documentType.Trim() };
    var actorId = GetActorId(user);
    var stored = await storage.StoreAsync(file, projectId, document.Id, 1);
    document.Versions.Add(new DocumentVersion { VersionNumber = 1, OriginalFileName = Path.GetFileName(file.FileName), BlobUrl = stored.BlobUrl, ContentType = file.ContentType, SizeBytes = file.Length, Sha256 = stored.Sha256, UploadedById = actorId });
    document.Status = DocumentStatus.Ready;
    db.Documents.Add(document);
    await WriteAudit(db, user, "uploaded", "document", document.Id, $"Uploaded {file.FileName} to {project.Name}");
    await db.SaveChangesAsync();
    return Results.Created($"/api/documents/{document.Id}", new { document.Id, document.Title, document.Status, document.CurrentVersion });
}).RequireAuthorization("CanEdit").DisableAntiforgery();

var approvals = app.MapGroup("/api/approvals").RequireAuthorization();
approvals.MapPost("/", async (CreateApprovalRequest request, BuildFlowDbContext db, ClaimsPrincipal user) =>
{
    if (!await db.Documents.AnyAsync(document => document.Id == request.DocumentId)) return Results.NotFound();
    var approval = new ApprovalRequest { DocumentId = request.DocumentId, RequestedById = GetActorId(user), Note = request.Note };
    db.Approvals.Add(approval);
    await WriteAudit(db, user, "requested approval for", "document", request.DocumentId, "Submitted document for review");
    await db.SaveChangesAsync();
    return Results.Created($"/api/approvals/{approval.Id}", approval);
}).RequireAuthorization("CanEdit");

approvals.MapPost("/{approvalId:guid}/review", async (Guid approvalId, ReviewApprovalRequest request, BuildFlowDbContext db, ClaimsPrincipal user) =>
{
    var approval = await db.Approvals.FindAsync(approvalId);
    if (approval is null) return Results.NotFound();
    approval.Decision = request.Decision;
    approval.Note = request.Note;
    approval.ReviewedAt = DateTimeOffset.UtcNow;
    approval.ReviewedById = GetActorId(user);
    await WriteAudit(db, user, request.Decision.ToString().ToLowerInvariant(), "approval", approval.Id, "Reviewed approval request");
    await db.SaveChangesAsync();
    return Results.Ok(approval);
}).RequireAuthorization("CanApprove");

app.MapGet("/api/audit-logs", async (BuildFlowDbContext db) => await db.AuditLogs.AsNoTracking().OrderByDescending(log => log.CreatedAt).Take(100).ToListAsync())
    .RequireAuthorization("CanApprove");

app.Run();

static Guid GetActorId(ClaimsPrincipal user) => Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
static Task WriteAudit(BuildFlowDbContext db, ClaimsPrincipal user, string action, string entityType, Guid entityId, string summary)
{
    db.AuditLogs.Add(new AuditLog { ActorId = GetActorId(user), ActorName = user.Identity?.Name ?? "Unknown", Action = action, EntityType = entityType, EntityId = entityId, Summary = summary });
    return Task.CompletedTask;
}
