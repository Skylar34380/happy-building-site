# 2Form Consulting Pty Ltd Website Starter

This is a React website starter for 2Form Consulting Pty Ltd. The public site is written in React/JSX with CSS and Three.js. Production project updates are handled by Node.js API routes under `api/`, with project media and the project JSON database stored in Azure Blob Storage.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:8080`.

The public website is available at `/`. The staff project updater is available at `/admin`.

Prototype admin login:

```text
Account: happy123
Password: happy789
```

This fallback login only works during local Vite development. In production, `/admin` uses `POST /api/auth/login` and requires environment variables.

## Production data flow

1. Admin signs in at `/admin`.
2. Admin selects a cover image from their computer.
3. The frontend asks `POST /api/uploads/sign` for a short-lived Azure Blob upload URL.
4. The browser uploads the file directly to Azure Blob Storage.
5. The frontend saves the project text and final image URL with `POST /api/projects`.
6. The public portfolio loads live records from `GET /api/projects`.

## Azure data setup

Create one Azure Storage Account and one Blob container:

```text
Storage account: twoformmedia2026
Container: project-media
Project data blob: data/projects.json
Project images folder: projects/
```

The API will automatically create `data/projects.json` from the local seed file the first time it reads from Azure and does not find that blob.

The optional `database/schema.sql` file is kept only as a future upgrade path if the project later needs a real relational database.

## Environment variables

Copy `.env.example` into the final hosting platform's environment settings and fill in real values:

```text
ADMIN_USERNAME
ADMIN_PASSWORD
JWT_SECRET
AZURE_STORAGE_ACCOUNT
AZURE_STORAGE_CONTAINER
AZURE_STORAGE_ACCOUNT_KEY
AZURE_PROJECTS_BLOB_NAME
```

Azure Blob Storage also needs CORS enabled for the production domain so the browser can `PUT` uploaded files to the signed URL.

Generate `JWT_SECRET` with:

```bash
npm run secret
```

`JWT_SECRET` is not a password. It is a private server-side signing secret used to prove that an admin login token was created by your backend.

## Azure Static Web Apps CI/CD

This repository includes a GitHub Actions workflow at `.github/workflows/azure-static-web-apps.yml`.

Create an Azure Static Web App connected to the GitHub repository and use:

```text
App location: /
Api location: api
Output location: dist
Build command: npm run build
```

Add this GitHub repository secret:

```text
AZURE_STATIC_WEB_APPS_API_TOKEN
```

Then add these application settings in the Azure Static Web App configuration:

```text
ADMIN_USERNAME
ADMIN_PASSWORD
JWT_SECRET
AZURE_STORAGE_ACCOUNT
AZURE_STORAGE_CONTAINER
AZURE_STORAGE_ACCOUNT_KEY
AZURE_PROJECTS_BLOB_NAME
```

The GitHub token used to push this repository must include `workflow` scope because this project contains a `.github/workflows` file.

## Local update fallback

If the API environment is not configured during local Vite development, the admin page can still download a prototype `projects.json` fallback. You can also run:

```bash
npm run add-project
```

Then validate the local JSON fallback:

```bash
npm run validate
```

## Import existing myCloud project images

Download the project image folders from myCloud first. Then run the importer with Azure environment variables configured locally:

```bash
npm run upload-media -- "/path/to/downloaded/mycloud-folder"
```

The importer uses `data/project-media-manifest.json` to match each local project folder to the project records. It uploads the first image in each folder as the project cover, updates `public/data/projects.json`, mirrors `data/projects.json`, and writes the live `data/projects.json` blob to Azure Storage.

To choose a specific cover image for a project, add `cover` to the matching manifest entry:

```json
{
  "id": "4l-coral-coast-drive-apartment",
  "folder": "4L Coral Coast Drive_Apartment",
  "cover": "P001.jpg"
}
```

## What to customize before launch

- Company name, logo mark, phone, email, licence number, and service area.
- Real project photos through Azure Blob upload.
- Real project descriptions, categories, and service copy.
- Real admin password and long random `JWT_SECRET`.
