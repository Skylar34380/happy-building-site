# 2Form Consulting Pty Ltd

[www.2form.com.au](https://www.2form.com.au) is the public website for 2Form Consulting Pty Ltd, a Melbourne-based residential and commercial architecture and construction consultancy.

The website is a React single-page application with an Azure-backed project portfolio and a protected staff admin area for updating project details and images.

## Technology

- React 19, JSX and CSS
- Three.js for architectural motion studies
- Vite for local development and production builds
- Azure Static Web Apps for hosting and serverless API routes
- Azure Blob Storage for project images and live portfolio data
- GitHub Actions for checks, pull-request previews and Azure deployment

## Website areas

- `/` - public company website: About, Team, Portfolio, Services, What we do and Contact
- `/admin` - staff-only project management area
- `api/` - Node.js serverless routes for login, project data and signed Azure uploads

## Run locally

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:8080`.

Before testing Azure-backed admin uploads locally, create a `.env` file from `.env.example` and fill in the Azure and admin credentials. Never commit this file.

## Production content workflow

1. A staff member signs in at `/admin`.
2. They add or edit a project and select its images.
3. The API creates short-lived Azure Blob upload URLs.
4. Images upload directly to Azure Blob Storage and project data is written to `data/projects.json` in the `project-media` container.
5. The public portfolio reads `GET /api/projects`, so the website updates without editing React components.

## Azure configuration

The live site uses Azure Static Web Apps and Azure Blob Storage.

Required application settings:

```text
ADMIN_USERNAME
ADMIN_PASSWORD
JWT_SECRET
AZURE_STORAGE_ACCOUNT
AZURE_STORAGE_CONTAINER
AZURE_STORAGE_ACCOUNT_KEY
AZURE_PROJECTS_BLOB_NAME
```

For browser image uploads, Azure Blob Storage CORS must allow `https://www.2form.com.au`, the `PUT` and `OPTIONS` methods, and the headers used by the signed upload request.

## CI/CD

The workflow at `.github/workflows/azure-static-web-apps.yml` runs for pull requests and updates to `main`:

1. `npm ci` installs locked dependencies.
2. `npm run check` validates project data, checks API imports and builds the production site.
3. Azure Static Web Apps deploys only after the checks pass.
4. Pull requests receive an Azure preview environment; merging to `main` updates production.

Create a feature branch for each update, push it, then open a pull request into `main`:

```bash
git switch -c site-update/footer-polish
npm run check
git add .
git commit -m "Refine portfolio and footer"
git push -u origin site-update/footer-polish
```

The included `scripts/deploy-azure.sh` also creates a new branch rather than pushing directly to `main`.

## Project media import

To import a folder of project images into Azure Blob Storage:

```bash
npm run upload-media -- "/path/to/project-image-folders"
```

The mappings in `data/project-media-manifest.json` match source folders to project records. Run the checks before committing:

```bash
npm run check
```
