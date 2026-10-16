# todAI

todAI is a small, responsive task manager built with Next.js. It keeps tasks private in a local SQLite database and provides a dashboard where tasks can be searched, paginated, created, edited, and deleted without leaving the page. Create, edit, and delete actions open focused dialogs.

## Requirements

- Node.js 20.9 or newer
- npm

## Run locally

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Tasks are stored in `data/todai.sqlite`; the directory and schema are created automatically. To choose a different database file, set `TASKS_DB_PATH` to its path before starting the app.

## Checks

```sh
npm test
npm run test:components
npm run typecheck
npm run build
```

`npm run test:components:open` starts Cypress Component Testing interactively. Cypress component specs and the existing isolated task-data tests are kept under `tests/`. Component tests mount the task workspace directly and mock every API request with `cy.intercept`; they do not start the application backend or share server state.

## Storage and deployment

SQLite uses write-ahead logging for reliable local reads and writes. Keep the database file and its `-wal`/`-shm` sidecars together, and back up the database when the app is stopped or after checkpointing. Production hosting must provide a persistent writable disk; ephemeral serverless filesystems are not suitable for durable storage.

## Task API

- `GET /api/tasks?q=term&page=1&limit=20` — list tasks, optionally matching title or description; returns `{ tasks, total, page, limit }`
- `POST /api/tasks` — create a task with a required title and optional description
- `GET /api/tasks/:id` — fetch one task
- `PATCH /api/tasks/:id` — update a task
- `DELETE /api/tasks/:id` — delete a task

Titles are trimmed and limited to 200 characters. Descriptions are optional and limited to 5,000 characters.

The legacy `/tasks` and task-form URLs redirect to the task workspace on the home page.
