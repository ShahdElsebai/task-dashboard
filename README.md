# Task Manager

A task management dashboard built with **Angular 22** and **Optimus UI**: a kanban board with drag and drop, task filtering and search, a create/edit form, analytics charts, an activity feed and a team overview, in **English and Arabic (RTL)**.

![CI](https://github.com/ShahdElsebai/task-dashboard/actions/workflows/ci.yml/badge.svg)

|                          |                                                                      |
| ------------------------ | -------------------------------------------------------------------- |
| **Tests**                | 169 unit and integration tests, 90% statement coverage               |
| **Bundle**               | 484 kB initial (121 kB over the network), under the 500 kB budget    |
| **Lighthouse (desktop)** | Performance 92–99 · Accessibility 100 · Best practices 100 · SEO 100 |
| **Accessibility**        | 0 axe-core violations on every page, in both languages               |

---

## Contents

1. [Quick start](#quick-start)
2. [Features](#features)
3. [Scripts](#scripts)
4. [Environment configuration](#environment-configuration)
5. [Architecture](#architecture)
6. [State management and data flow](#state-management-and-data-flow)
7. [Key decisions](#key-decisions)
8. [Testing strategy](#testing-strategy)
9. [Performance](#performance)
10. [Accessibility and internationalisation](#accessibility-and-internationalisation)
11. [Docker and CI](#docker-and-ci)
12. [Known limitations and future improvements](#known-limitations-and-future-improvements)

---

## Quick start

Requirements: **Node 22** (see `.nvmrc`) and npm.

```bash
npm install
npm run dev
```

`npm run dev` starts the mock API (json-server on port 3000) and the app (http://localhost:4200) together. The dev server proxies `/api/*` to the mock API (`proxy.conf.json`).

> `npm start` runs only the app. Without the API, the pages show their error state with a Retry button.

Every start of the mock API resets the data from `mock-api/db.json`, so you can experiment freely.

**With Docker** (production build behind nginx):

```bash
docker compose up --build    # http://localhost:8080
```

---

## Features

**Dashboard** (`/dashboard`)

- Stat cards: total, completed, in progress and overdue. They are computed live from the tasks, so they update immediately after every change.
- Kanban board with three fixed columns (To Do, In Progress, Done):
  - **Drag and drop** to reorder within a column or move to another one.
  - **Keyboard alternative** in each card's menu: _Move up / Move down / Move to …_
  - Filters by status, priority and assignee, plus real-time search from the header.
  - **Filters live in the URL** (`?status=todo&priority=high&assignee=user-001&q=design`), so a filtered view can be bookmarked or shared, and Back/Forward work.
- **Create / edit dialog**, opened through the URL (`?task=new`, `?task=<id>`):
  - **Fields:** title, description, status, priority, due date, assignee, and tags.
  - **Custom validators:** the title can't be only spaces; tags must be unique (case-insensitive); the due date can't be in the past, except for finished tasks or the date the task already had.
  - **Dynamic controls:** tags are a `FormArray` (add and remove, max 5).
  - **Unsaved changes:** a warning appears on close, Escape or page unload.
  - **Failed saves:** if a save fails, the dialog stays open and keeps the input.
- Delete with a confirmation dialog.

**Analytics** (`/analytics`)

- Doughnut chart by status and bar chart by priority (Chart.js). Each has an HTML legend with counts and percentages, which also serves as the text alternative.
- Recent activity feed with relative times ("3 hours ago" / "منذ 3 ساعات"). Entries link to the task.

> The dashboard has room only for the stat cards and the board, so the charts and the activity feed (listed under _Dashboard features_ in the requirements) are on their own page, linked from the sidebar.

**Team** (`/team`): each user's open, completed and overdue tasks and completion rate. _View tasks_ opens the board filtered by that person.

**Everywhere**

- English and Arabic, with full right-to-left layout.
- Responsive from 375 px phones to desktop. The sidebar becomes a drawer on small screens.
- Loading skeletons, error states with Retry, and a 404 page.

---

## Scripts

| Command                           | What it does                                                        |
| --------------------------------- | ------------------------------------------------------------------- |
| `npm run dev`                     | Mock API + app with live reload                                     |
| `npm start`                       | App only (`ng serve`)                                               |
| `npm run mock:api`                | Mock API only, reset from `mock-api/db.json`                        |
| `npm run mock:generate`           | Regenerate the seed data (`generate-data.cjs`, then `build-db.cjs`) |
| `npm run build`                   | Production build into `dist/` (fails above a 550 kB initial bundle) |
| `npm test`                        | Unit tests in watch mode (Vitest)                                   |
| `npm run test:ci`                 | Unit tests once                                                     |
| `npm run test:coverage`           | Unit tests once with a coverage report in `coverage/`               |
| `npm run lint` / `lint:fix`       | ESLint (TypeScript and templates)                                   |
| `npm run format` / `format:check` | Prettier                                                            |

**Git hooks** (Husky):

- **pre-commit:** runs lint-staged, which applies ESLint and Prettier to the staged files.
- **commit-msg:** runs commitlint, which enforces [Conventional Commits](https://www.conventionalcommits.org/).

---

## Environment configuration

`src/environments/environment.ts` (development) and `environment.production.ts`:

| Key           | Default          | Purpose                                             |
| ------------- | ---------------- | --------------------------------------------------- |
| `apiUrl`      | `/api`           | Prefix added to API calls by `apiUrlInterceptor`    |
| `defaultLang` | `en`             | Language used when none is stored in `localStorage` |
| `production`  | `false` / `true` | Build flag                                          |

`/api` is resolved by the dev proxy locally and by nginx in Docker (`docker/nginx.conf`). To use a real backend, point that proxy, or `apiUrl`, at it.

---

## Architecture

Standalone components only (no NgModules). Components are `OnPush` (the default in Angular 22) and use signals throughout.

```text
src/app
├── core/                    app-wide, no UI
│   ├── config/              i18n, theme preset, navigation, constants
│   ├── dto/                 API contracts, used directly (no mapping layer)
│   ├── models/
│   ├── services/
│   │   ├── api/             users and activities endpoints
│   │   ├── http/            interceptors: api-url, loading, error, cache, retry
│   │   └── store/           UsersStore, ActivityStore (shared across features)
│   └── utils/               dates, collections, resources, task rules
├── shared/                  presentational building blocks
│   └── components/          activity-feed, empty-state, error-state, user-avatar
├── layout/                  shell: header, sidebar, drawer, toasts
└── features/                each one lazy-loaded
    ├── dashboard/
    │   ├── dashboard.component.*     the routed page (smart)
    │   ├── dashboard.{config,model,utils}.ts
    │   ├── components/
    │   │   ├── board/                 filters + columns + dialog wiring (smart)
    │   │   ├── board-column/          presentational from here down
    │   │   ├── board-task-card/       + .model .utils .config
    │   │   ├── board-task-form-dialog/  + .model .utils .config
    │   │   ├── board-filters/  board-priority-badge/
    │   │   └── dashboard-stat-card/  dashboard-skeleton/
    │   └── services/
    │       ├── dashboard-api.service.ts          HTTP
    │       ├── dashboard-tasks-state.service.ts  task data and every write
    │       ├── dashboard-state.service.ts        stat cards
    │       └── board-state.service.ts            filters and columns
    ├── analytics/  team/  not-found/  coming-soon/
src/testing/                 shared test helpers (@testing)
```

**Rules the structure follows**

- **Folder per component.** Every component folder holds its own `.config.ts` (constants), `.model.ts` (types) and `.utils.ts` (pure functions with their own tests).
- **Smart vs. presentational.** Only routed pages and `BoardComponent` inject services. Every other component takes inputs, emits outputs, and is easy to test in isolation.
- **Feature isolation.** Features never import from each other:
  - shared logic lives in `core/` (e.g. `isTaskOverdue`, `SearchService`)
  - shared UI lives in `shared/`
  - this is why the header talks to a core `SearchService` rather than to the dashboard
- **Path aliases.** `@core/*`, `@shared`, `@features/*`, `@env/*` and `@testing` replace long relative imports. An ESLint rule keeps import groups ordered.

---

## State management and data flow

Plain Angular signals in services, with no state library. The app has one main entity (tasks) and a few views of it, so signals give the same guarantees (single source of truth, derived state, fine-grained change detection) with much less code than NgRx.

```text
DashboardApiService ──httpResource──▶ DashboardTasksStateService ──▶ BoardStateService ──▶ board UI
     (HTTP)                            tasks, CRUD, move, rollback     filters, columns
                                                │
                                                └──────────────────▶ DashboardStateService ──▶ stat cards
```

- **Reads** use Angular's `httpResource`: loading, error and value are signals, and Retry is `resource.reload()`.
- **Writes** use `HttpClient` and are **optimistic**: the UI updates at once, then the server confirms it or the change is rolled back (`patchById` / `restoreById`). Write methods resolve to `true`/`false`, so callers such as the dialog know whether to close.
- **Derived state** (columns, stats, filtered tasks) is `computed()`, so nothing is stored twice.
- **Page-scoped state.** `AnalyticsStateService` and `TeamStateService` are provided by their page component rather than in root. Each visit creates a fresh resource, so those pages always reflect changes made on the board.
- **The URL is state too.** Filters and the open task sync with query params in both directions (`BoardComponent.syncFiltersWithUrl`).

**HTTP pipeline** (`core/services/http`, in this order):

1. **api-url:** adds `/api`.
2. **loading:** feeds a global loading flag.
3. **error:** shows a toast for failed writes. Failed reads show the page's error state instead, so the same failure isn't reported twice.
4. **cache:** keeps GET responses for 30 s. Any write clears the cached responses of the same collection.
5. **retry:** retries failed GETs twice (300 ms, then 600 ms) on network errors and 5xx. Only GETs are retried, because repeating a POST could create the same task twice.

---

## Key decisions

**Gap-based positions.** Tasks are ordered by a numeric `position` spaced 1000 apart (1000, 2000, 3000 …).

- Moving a task gives it the midpoint between its new neighbours, so **a move is one PATCH**, not a renumbering of the column.
- When neighbours are adjacent integers (no midpoint left), only that column is rebalanced, and only the tasks whose position actually changes are saved.
- See `positionBetween` / `planMove` in `dashboard.utils.ts`.

**Moving while filtered.** When filters hide tasks, the drop index the user sees doesn't match the full column. `toFullIndex` maps it so hidden tasks keep their order and nothing collides. For example, with A, B, C in a column and B hidden, dropping D between A and C gives A, B, D, C.

**Static columns.** The three columns are fixed by `TaskStatus`, not user-defined lists. This matches the API model (status is an enum on the task) and keeps the board predictable. Custom columns are listed under future improvements.

**URL-driven dialog.** `?task=new` / `?task=<id>` opens the form. Deep links, the sidebar's _New Task_ button, activity-feed links and the Back button then all work without extra state. Unknown ids show a "not found" toast.

**DTOs used directly.** The API shapes are already what the UI needs, so there is no mapping layer to maintain. Values that go stale, such as the API's `isOverdue` flag and the `/statistics` numbers, are computed in the app instead.

**`valueOr` for resources.** `httpResource.value()` throws once a request has failed, even when the resource has a `defaultValue`. Every store reads through `valueOr(resource, fallback)`, so a failed request shows the error UI instead of breaking the page.

---

## Testing strategy

**Vitest** through the Angular CLI, running zoneless.

- **169 tests in 33 files.** Coverage: **90% statements, 92% branches, 86% functions, 93% lines**.

| Layer                   | What is tested                                                                                               | How                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| Pure logic              | Positions, filtering, stats, form validators, relative time, workload                                        | Plain function tests, no TestBed                |
| Services                | State services, optimistic updates and rollback, the failed-load path                                        | `HttpTestingController` with real interceptors  |
| Interceptors and config | Caching and invalidation, retry and backoff, error toasts; a regression test for the NG0200 dependency cycle | Stacked interceptors on a test `HttpClient`     |
| Components              | Inputs and outputs, menus, keyboard moves, form behaviour                                                    | `TestBed`, `componentRef.setInput`, DOM queries |
| Integration             | Routed pages with real services: URL ↔ filters, the `?task=` dialog, delete confirmation                     | `RouterTestingHarness` with flushed HTTP        |

- **Test helpers:** shared builders (`makeTask`, `TEST_USER`, `storeTestProviders`) live in `src/testing`.
- **Charts in tests:** Chart.js can't draw in jsdom, so the chart card's logic is tested directly and the page tests stub the card.
- **Beyond unit tests:** every phase was also checked in a real browser with Playwright (drag and drop, keyboard moves, create/edit/delete, deep links, Back/Forward, both languages, phone and tablet widths), and with axe-core for accessibility.

---

## Performance

- **Lazy loading:** the layout and every page are lazy routes. Chart.js loads only with Analytics.
- **Bundle budget:** 500 kB warning, 550 kB error, enforced in CI. Initial bundle 484 kB.
  - **Theme:** a slim Aura preset with only the 15 components in use (`theme.preset.ts`). The full preset ships tokens for about 80 components, roughly 130 kB.
  - **Toast:** loads with the layout instead of the root component.
- **Rendering:** OnPush everywhere, signals and `computed` for derived values, and `track` in every `@for`.
- **Network:** HTTP caching interceptor, a single PATCH per move, and optimistic updates (no waiting for the server).
- **RxJS hygiene:** `takeUntilDestroyed` / `toSignal`, so there are no manual subscriptions to leak.

**Lighthouse 12** on the production build (`npm run build`, served like `docker/nginx.conf`). Full reports are in `docs/lighthouse/`.

| Page      | Device  | Perf | A11y | Best practices | SEO | FCP   | LCP   | TBT    | CLS   |
| --------- | ------- | ---- | ---- | -------------- | --- | ----- | ----- | ------ | ----- |
| Dashboard | Desktop | 92   | 100  | 100            | 100 | 0.6 s | 1.0 s | 200 ms | 0.007 |
| Dashboard | Mobile  | 65   | 100  | 100            | 100 | 2.8 s | 4.2 s | 650 ms | 0     |
| Analytics | Desktop | 99   | 100  | 100            | 100 | 0.6 s | 0.9 s | 50 ms  | 0     |
| Analytics | Mobile  | 70   | 100  | 100            | 100 | 3.0 s | 4.0 s | 480 ms | 0     |
| Team      | Desktop | 99   | 100  | 100            | 100 | 0.6 s | 0.8 s | 40 ms  | 0     |
| Team      | Mobile  | 69   | 100  | 100            | 100 | 2.7 s | 3.8 s | 600 ms | 0     |

The mobile profile emulates a slow phone (4× CPU slowdown, slow 4G). Almost all of its time goes to evaluating the main bundle (Angular and Optimus UI), not to the network. See [future improvements](#known-limitations-and-future-improvements).

---

## Accessibility and internationalisation

**Accessibility (WCAG 2.1 AA).** axe-core reports **0 violations** on every page in both languages, including the open dialog with errors showing and the mobile drawer.

- **Keyboard:**
  - A skip link jumps to the content.
  - Every drag-and-drop action is also in the card menu.
  - The dialog traps focus and starts on the title field.
  - The first invalid field is focused on submit.
  - Focus rings are 2 px.
- **Screen readers:**
  - Landmarks, one `h1` per page, and headings in order.
  - Field errors are linked with `aria-describedby`.
  - Charts carry a text summary.
  - Team progress uses a native `<progress>`.
- **Colour:** text colours meet 4.5:1, including priority and status colours on their tinted backgrounds.
- **Motion:** card, drag and page transitions are disabled under `prefers-reduced-motion`.

**Internationalisation.** ngx-translate, with English and Arabic in `src/assets/i18n/`.

- Switching language sets `lang` and `dir` on `<html>`. The layout uses logical properties (`ms-*`, `ps-*`, `border-s`), so it mirrors without separate styles.
- **Built-in texts:** Optimus components' own texts (e.g. close buttons) are translated from the `optimus` section of each language file.
- **RTL details:**
  - Bar charts run right-to-left.
  - Directional icons flip.
  - Toasts move to the top-left.
  - Left-to-right content such as emails and `@handles` is isolated with `dir="ltr"` / `<bdi>`.
- **Locale formats:** dates and relative times use `Intl`, so they follow the active language.

---

## Docker and CI

**Docker** (`docker compose up --build`, then http://localhost:8080)

- `Dockerfile`: a multi-stage build. Node 22 builds the app, and nginx serves it with SPA fallback, gzip, one-year caching for hashed files, no-cache for `index.html` and translations, and `/api` proxied to the API container.
- `docker/api.Dockerfile`: json-server with the seed data, reset on every start.

**GitHub Actions** (`.github/workflows/ci.yml`), on every push to `main` and every pull request:

1. `npm ci`
2. Prettier check
3. ESLint
4. Tests with coverage (the report is uploaded as an artifact)
5. Production build, which fails if the bundle exceeds its budget
6. A second job builds both Docker images.

---

## Known limitations and future improvements

- **Mock backend.** json-server has no authentication, validation or concurrency control. Two people moving tasks at the same moment could both win; a real API would need versioning (ETags) or server-side ordering.
- **Mobile performance (65–70).** The next step would be server-side rendering or prerendering of the shell, so the first paint doesn't wait for the main bundle. Another option is trimming Optimus's runtime styling.
- **Static columns.** User-defined columns would need a `columns` resource and a `columnId` on tasks.
- **Placeholder pages.** _Tasks_, _Calendar_ and _Settings_ are placeholders ("Coming soon").
- **No end-to-end suite in CI.** Browser flows were verified manually with Playwright during development. Adding them as a Playwright suite in CI would protect the drag-and-drop and URL flows.
- **Other ideas:** dark mode (the theme already has a dark-mode selector), real-time updates (WebSocket or SSE), and undo for delete.
