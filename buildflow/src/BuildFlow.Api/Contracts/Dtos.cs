using BuildFlow.Api.Domain;

namespace BuildFlow.Api.Contracts;

public sealed record LoginRequest(string Email, string Password);
public sealed record LoginResponse(string Token, string DisplayName, string Role);
public sealed record CreateProjectRequest(string Name, string ClientName, string Address, ProjectStatus Status);
public sealed record UpdateProjectStatusRequest(ProjectStatus Status);
public sealed record CreateApprovalRequest(Guid DocumentId, string? Note);
public sealed record ReviewApprovalRequest(ApprovalDecision Decision, string? Note);
public sealed record ProjectResponse(Guid Id, string Name, string ClientName, string Address, ProjectStatus Status, int DocumentCount);
