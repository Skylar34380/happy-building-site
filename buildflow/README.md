# BuildFlow

BuildFlow is a construction document-control and approval platform for small architecture and construction teams. It provides a traceable workflow for projects, uploaded drawings, document versions, reviews, approvals, and audit events.

The project is intentionally separate from the public 2Form website. The website is for clients; BuildFlow is an internal operations product that demonstrates backend architecture and team workflows.

## What it demonstrates

- **ASP.NET Core 8 minimal APIs** with OpenAPI/Swagger documentation.
- **PostgreSQL + Entity Framework Core** relational modelling for users, projects, documents, versions, approvals, and audit logs.
- **JWT authentication and role-based authorization** for `Admin`, `Director`, `Architect`, and `Drafter` roles.
- **Controlled document uploads** with MIME type/size validation and a SHA-256 integrity fingerprint.
- **Azure Blob Storage adapter** for cloud file storage, with a local fallback for development.
- **Approval workflow and immutable-style audit trail** recording who changed what and when.
- **React + Vite operations dashboard** designed for document control rather than a marketing site.
- **Docker Compose** local API/PostgreSQL environment and **GitHub Actions CI** for API tests and frontend production builds.

## Architecture

```text
React + Vite dashboard
        |
        | JWT-authenticated REST API
        v
ASP.NET Core 8 / BuildFlow.Api
   |             |              |
   |             |              +-- Azure Blob Storage (document binaries)
   |             +-- PostgreSQL + EF Core (business data and audit logs)
   +-- Swagger / OpenAPI
```

## Domain model

| Entity | Purpose |
| --- | --- |
| `ApplicationUser` | Team identity, password hash, and role. |
| `ConstructionProject` | Client project and lifecycle status. |
| `ProjectDocument` | Controlled record, current version, and processing state. |
| `DocumentVersion` | Original filename, blob URL, SHA-256 hash, uploader, and version number. |
| `ApprovalRequest` | Review request, decision, reviewer, and timestamp. |
| `AuditLog` | Actor, action, target entity, summary, and UTC timestamp. |

## Run locally with Docker

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. In this folder, create `.env` from `.env.example` and set a strong local `Jwt__Key`.
3. Run:

```bash
docker compose up --build
```

4. Open the API documentation at `http://localhost:8080/swagger`.

The API seeds a **development-only** account on first startup:

```text
email: director@buildflow.local
password: BuildFlow!2026
```

Never retain this account or development JWT secret in a real deployment.

## Run without Docker

Prerequisites: .NET 8 SDK, PostgreSQL 16, and Node.js 22+.

```bash
# API
export ConnectionStrings__BuildFlow='Host=localhost;Port=5432;Database=buildflow;Username=buildflow;Password=your-password'
export Jwt__Key='replace-with-a-long-random-secret-at-least-32-characters'
dotnet run --project src/BuildFlow.Api

# Dashboard, in another terminal
cd frontend
npm install
cp .env.example .env
npm run dev
```

## API workflow

1. `POST /api/auth/login` returns a JWT token.
2. An authorized Architect, Director, or Admin creates a project.
3. An authorized editor uploads a PDF/JPG/PNG up to 30 MB. The API validates metadata, calculates a SHA-256 checksum, writes to Blob Storage, saves the version, and logs the action.
4. An editor creates an approval request.
5. A Director or Admin approves/rejects it; BuildFlow records the reviewer, decision, timestamp, and audit event.

## Key endpoints

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET` | `/health` | Public health check |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/projects` | Any signed-in user |
| `POST` | `/api/projects` | Admin / Director / Architect |
| `PATCH` | `/api/projects/{id}/status` | Admin / Director / Architect |
| `POST` | `/api/projects/{id}/documents` | Admin / Director / Architect |
| `POST` | `/api/approvals` | Admin / Director / Architect |
| `POST` | `/api/approvals/{id}/review` | Admin / Director |
| `GET` | `/api/audit-logs` | Admin / Director |

## Cloud configuration

For Azure, provide secrets through the runtime environment or a managed secret store, never source control:

```text
ConnectionStrings__BuildFlow=Host=...;Database=...;Username=...;Password=...;Ssl Mode=Require
Jwt__Key=<long-random-secret>
AzureStorage__ConnectionString=DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;
```

The Blob adapter stores document content under:

```text
buildflow-documents/{projectId}/{documentId}/v{version}/{fileName}
```

## Quality gates

GitHub Actions runs on pull requests and pushes to `main`:

- restores, compiles, and tests the .NET API;
- builds the React dashboard for production.

## Portfolio summary

> Built a construction document-control platform using ASP.NET Core 8, PostgreSQL/EF Core, Azure Blob Storage, JWT/RBAC, and React. Designed versioned document uploads with SHA-256 integrity checks, approval workflows, role-gated REST APIs, and auditable activity history; containerised local services with Docker Compose and automated API/frontend checks through GitHub Actions.
