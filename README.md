# Premium Construction Company Website Starter

This is a React website starter for a premium construction company. The app is written in JavaScript/JSX with CSS, while projects are stored in `public/data/projects.json`.

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

This is only a front-end prototype login for local design work. Use real authentication, such as Supabase Auth, before production launch.

## Update projects

There are two easy options.

1. Open the `Project database` section on the website, fill out the project form, and download the updated `projects.json`.
2. Run the terminal helper:

```bash
npm run add-project
```

After updating, run:

```bash
npm run validate
```

## Suggested staff workflow

1. Add project photos to `public/assets/`.
2. Add or update the project in `public/data/projects.json`.
3. Commit the change to GitHub.
4. The GitHub Actions content check validates the project file automatically.

## What to customize before launch

- Company name, logo mark, phone, email, licence number, and service area.
- Real project photos in `assets/`.
- The sample metrics and service copy.
- Hosting setup, such as GitHub Pages, Netlify, Vercel, or a traditional web host.
