# Leave Management System

A full-stack leave management system for tracking employee leave requests, approvals, and balances. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, and PostgreSQL.

live url: https://leave-management-system-swart.vercel.app/

## Features

### Employee
- Email/password login with a signed, httpOnly session cookie
- Apply for leave with a leave type, date range, and reason
- Automatic working-day calculation (weekends excluded) with a live balance preview
- Leave history with status filtering, and the ability to cancel a pending request
- Leave balance breakdown per leave type: entitled, used, pending, and remaining

### Admin
- Overview with headcount, leave type count, pending approvals, requests this month, and a status breakdown
- A recent-requests list capped at 10, with a **Show all** link into the full approvals view
- Approve or reject leave requests, with an optional rejection note
- User management: create, edit, and deactivate accounts for both employees and admins
- Leave type management: create, edit, and deactivate leave types with annual quotas

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix primitives) |
| Icons | lucide-react |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod resolver |
| Database | PostgreSQL via `postgres` driver |
| ORM | Drizzle ORM + Drizzle Kit |
| Auth | Custom JWT session (`jose`) + `bcryptjs` password hashing (10 salt rounds) |
| Validation | Zod v4 |

## Architecture

- **No server actions.** All reads go through route handlers with `GET`; writes go through `POST` to save and `DELETE` to remove.
- **One schema per rule.** `src/lib/schemas.ts` is the single source of truth for validation. The same Zod schemas back both the React Hook Form client forms and the API route handlers, so a rule can never drift between the two layers. Client validation is a convenience; the server re-validates every payload and is the actual enforcement point.
- **One verb per intent.** Each entity route exposes `GET` to read, `POST` to save, and `DELETE` to soft-delete. `POST` is an upsert with no `action` field: a body without `id` creates and a body with `id` updates. The two shapes are genuinely different, so each save schema is a `z.union` of a create body and a partial body extended with `id`.
- **Uniform envelope.** Every response is `{ "status": boolean, "message": string, "data": object | null }`, described by the `ApiResponseBody` interface in `src/lib/http.ts`. The `ApiResponse` object builds it: `ApiResponse.send(data, status?)` for a success, always with the one fixed message `"Request completed successfully."`, and `ApiResponse.failed(status, message)` for a failure, always with `status: false` and `data: null`. The numeric status lives only in the HTTP response line, never in the body, so the frontend reads a boolean rather than a code it would have to map back to a message.
- **Errors are values, not throws.** Domain failures are represented by the `AppError` class in `src/lib/errors.ts`, which carries a status code and a message. Handlers return a Go-style labeled tuple `[data, error]` built by `ok()` and `fail()`, so every failure path shows up in the return type instead of hiding in a stack trace. `handleRoute` is a thin last-resort boundary that only catches what escapes a handler: auth guards, Zod validation, and unexpected database errors.
- **Two layers.** `route.ts` is the controller: it authenticates the caller, validates input with Zod, calls the handler, and turns the returned tuple into a response. `handlers.ts` is pure logic and queries — it never touches HTTP and never throws for a domain rule. When a handler needs the caller, the route passes the session in as an argument.
- **Soft deletes.** All three tables carry a `deletedAt` timestamp. Deletes set the timestamp instead of removing the row, preserving leave history. Every read filters on `deletedAt IS NULL`.
- **Computed balances.** There is no balance table. A balance is derived at read time from the leave type's `annualQuotaDays` minus the sum of approved and pending request days for the current year. Requests are attributed to a year by their start date, so cross-year ranges are not double counted.
- **Session auth.** `bcryptjs` hashes and verifies passwords with **10 salt rounds** (`SALT_ROUNDS` in `src/lib/auth/password.ts`); any hash inserted by hand must use the same cost to stay compatible. `jose` signs an HS256 JWT stored in the `lms_session` httpOnly cookie (7-day expiry, `sameSite=lax`). Authorization is enforced in three places: `src/proxy.ts` for route gating, server layouts via `requireUser`/`requireAdmin`, and again in each API route before the handler runs. Resource-level rules that depend on the record being touched, such as a user cancelling their own request, stay in the handler and come back as a `403` in the returned error.
- **No cache invalidation boilerplate.** Next.js 16 route handlers are uncached by default, so reads are always fresh and no `revalidateTag` calls are needed.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Set `DATABASE_URL` and `AUTH_SECRET`. Generate a secret with:

```bash
openssl rand -base64 32
```

### 3. Apply the database migrations

```bash
npm run db:migrate
```

This applies the SQL files in `drizzle/` in order. It is the only database step — there is no seed script.

If you are iterating on `src/db/schema.ts` locally and do not need migration history, `npm run db:push` syncs the schema directly instead.

### 4. Sign in

The demo database has these accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Qwerty@123` |
| Employee | `employee@example.com` | `Qwerty@123` |

Both roles land on their own dashboard. Admins additionally get the **Manage** section for approvals, users, and leave types.

These are shared demo credentials, so change them before the app is used anywhere real. The app hashes passwords with **10 bcrypt salt rounds**, so generate a replacement with the same cost:

```bash
node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 10))" 'your-password'
```

then update the row with the hash it prints:

```sql
UPDATE users SET password_hash = '<paste-hash-here>' WHERE email = 'admin@example.com';
```

#### Starting from an empty database

There is no seeder, and every user-management endpoint is admin-only, so on a fresh database the first admin has to be inserted directly:

```sql
INSERT INTO users (name, email, password_hash, role)
VALUES ('Admin', 'admin@example.com', '<paste-hash-here>', 'admin');
```

Sign in as that account, then use **Manage → Users** and **Manage → Leave types** to create the rest of the company.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by the app |
| `AUTH_SECRET` | Yes | Secret used to sign and verify session JWTs (32+ random bytes) |
| `NEXT_PUBLIC_APP_URL` | No | Public base URL, used for absolute links |

The app connects to the database lazily, so the project builds without a live database. A connection is only opened on the first query.

## Deployment

The app is currently deployed on **Vercel**. For a self-hosted production server it is built with Next.js `output: "standalone"`, which emits a self-contained server in `.next/standalone` that does not need `node_modules` on the target.

### Vercel

Vercel detects Next.js automatically. Connect the repository and add the three environment variables above in the project settings.

- Build command: `npm run build` (the default)
- Vercel runs the build and serves the output itself, so there are no static or public files to copy by hand.

Run the migration once, from any machine that can reach the database — a local checkout or CI step is fine:

```bash
DATABASE_URL='postgres://...' npm run db:migrate
```

Vercel's own build step will not apply migrations, so this has to be a deliberate step. There is no seed to run.

### Production server (standalone)

```bash
# 1. Install and build
npm ci
npm run build

# 2. Copy the static and public folders into the standalone output.
#    The minimal server does not include these; once copied it serves them.
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

# 3. Apply migrations. No seeding.
DATABASE_URL='postgres://...' npm run db:migrate

# 4. Start the server
node .next/standalone/server.js
```

`server.js` honours `PORT` and `HOSTNAME`, and reads `DATABASE_URL` and `AUTH_SECRET` from the environment:

```bash
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

Only `.next/standalone`, `public`, and `.next/static` are needed on the host. The full `.next` directory and `node_modules` are not, so do not ship them.

Before going live, set a real `AUTH_SECRET` and replace the demo accounts. The placeholder secret in `.env.example` and the shared `Qwerty@123` password are not safe to run in production.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript without emitting |
| `npm run db:generate` | Generate SQL migrations from the Drizzle schema |
| `npm run db:migrate` | Apply the generated migrations in `drizzle/` |
| `npm run db:push` | Push the schema directly to the database (no migration files) |
| `npm run db:studio` | Open Drizzle Studio to browse data |

## API reference

All endpoints are authenticated unless noted. Every response uses the same envelope, with the HTTP status code matching the outcome:

```jsonc
// success (HTTP 2xx)
{ "status": true, "message": "Request completed successfully.", "data": { "request": { } } }

// failure (HTTP 4xx / 5xx)
{ "status": false, "message": "Insufficient balance for Casual. 1 day(s) left.", "data": null }
```

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/auth/me` | User | Current session user |
| `POST` | `/api/auth/login` | Public | Sign in with `{ email, password }` |
| `POST` | `/api/auth/logout` | User | Clear the session cookie |
| `GET` | `/api/leave-requests` | User | List requests. `?status=` filters by status. `?scope=mine` limits to the caller's own requests, even for admins. `?userId=` returns one user's requests and is admin-only |
| `POST` | `/api/leave-requests` | User | Create with the full form. With `id`, review instead: `status: "cancelled"` cancels (own requests only), `approved`/`rejected` review (admin only) |
| `DELETE` | `/api/leave-requests?id=<uuid>` | Admin | Soft-delete a request |
| `GET` | `/api/leave-types` | User | List active leave types |
| `POST` | `/api/leave-types` | Admin | Create, or update when the body carries `id` |
| `DELETE` | `/api/leave-types?id=<uuid>` | Admin | Soft-delete a leave type |
| `GET` | `/api/balances` | User | Computed balances. Defaults to the session user; `?year=` overrides the year and `?userId=` targets another user (admin only) |
| `GET` | `/api/users` | Admin | List active users. With `?id=<uuid>`, return that single account, including soft-deleted ones so their history stays inspectable |
| `POST` | `/api/users` | Admin | Create with a password, or update when the body carries `id`. Password is optional on update |
| `DELETE` | `/api/users?id=<uuid>` | Admin | Soft-delete a user |
| `GET` | `/api/admin/stats` | Admin | Dashboard aggregates and the 10 most recent requests |

## Database schema

```
users
  id            uuid        primary key, default gen_random_uuid()
  name          varchar(255) not null
  email         varchar(255) not null, unique (users_email_idx)
  password_hash text        not null
  role          role        not null, default 'employee'   -- 'employee' | 'admin'
  department    varchar(255)
  joined_at     timestamptz not null, default now()
  created_at    timestamptz not null, default now()
  deleted_at    timestamptz                            -- soft delete

leave_types
  id                 uuid        primary key, default gen_random_uuid()
  name               varchar(255) not null
  code               varchar(50)  not null, unique (leave_types_code_idx)
  annual_quota_days  integer      not null, default 0   -- 0 means unlimited (e.g. unpaid)
  is_paid            boolean      not null, default true
  description        text
  created_at         timestamptz not null, default now()
  deleted_at         timestamptz                          -- soft delete

leave_requests
  id            uuid        primary key, default gen_random_uuid()
  user_id       uuid        not null, references users(id)
  leave_type_id uuid        not null, references leave_types(id)
  start_date    date        not null
  end_date      date        not null
  total_days    integer     not null                          -- working days, weekends excluded
  reason        text        not null
  status        leave_status not null, default 'pending'      -- 'pending' | 'approved' | 'rejected' | 'cancelled'
  reviewed_by   uuid        references users(id)
  reviewed_at   timestamptz
  review_note   text
  created_at    timestamptz not null, default now()
  deleted_at    timestamptz                              -- soft delete
```

Three indexes back the balance and approval queries: `leave_requests_user_idx`, `leave_requests_status_idx`, and `leave_requests_leave_type_idx`. Two unique indexes enforce the business keys: `users_email_idx` on `users(email)` and `leave_types_code_idx` on `leave_types(code)`.

### Business rules

- Leave days count weekdays only; Saturdays and Sundays are excluded.
- A request is rejected if the employee's used plus pending days for that leave type would exceed the annual quota. Leave types with a quota of `0` are unlimited.
- Only pending requests can be cancelled, and only by the employee who owns them.
- Only admins can review or delete requests, or manage users and leave types.
- Nobody can edit or delete their own account; the request is rejected with a `403`.

## Project structure

```
src/
  app/
    (app)/                    Authenticated routes
      admin/                  Overview, approvals, employees, leave types, users/[userId]
      leave/                  Apply, history
      dashboard/
      layout.tsx              requireUser guard, app shell
    api/                      Route handlers + sibling handlers.ts
    login/
    layout.tsx                Root layout, fonts, theme and query providers
  components/
    ui/                       shadcn/ui primitives
    providers/                Client-side context providers
    *.tsx                     App-level components
  db/
    schema.ts                 Drizzle schema
    index.ts                  Lazy database client
  features/
    types.ts                  Shared row types returned by the API
    auth/ balances/           TanStack Query hooks, one folder per domain
    leave-requests/ leave-types/ users/
  lib/
    auth/                     Password hashing, session, guards
    api-client.ts             Typed fetch wrapper
    leave-days.ts             Working-day calculation and formatting
    schemas.ts                Shared Zod schemas for forms and API handlers
    http.ts                   ApiResponse envelope, parseJson, handleRoute
    errors.ts                 AppError, and the ok() / fail() [data, error] pair
    constants.ts              Session cookie name, statuses, roles
    utils.ts                  cn() class-name helper
  proxy.ts                    Next.js request proxy (auth gating)
drizzle/                      Generated SQL migrations
```

Business rules and Drizzle queries live beside their routes:

```
src/app/api/<entity>/
  route.ts                 Controller: auth, Zod validation, tuple to ApiResponse
  handlers.ts              Service: business rules and Drizzle queries, no HTTP
```

## Learn more

- [Next.js documentation](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Query](https://tanstack.com/query)

## That's all

That covers the system: the feature set, the architectural rules, how to get it running locally, and how to deploy it. No seed data, one `DATABASE_URL`, and one migration step to get a production instance live.
