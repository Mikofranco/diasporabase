# Security Audit Report – Next.js + Supabase

Summary of issues found and fixes applied.

---

## 1. Supabase service_role key exposed on the client side — FIXED

**Issue:**  
- `lib/supabase/constants.tsx` exported `SUPABASE_ROLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, so the service role key was exposed to the browser.  
- `lib/supabase/client.ts` exposed `createAdminClient()` and `adminSupabase` using that key in the browser.  
- The client component `parts/superAdmin/create-admin/index.tsx` used `adminSupabase` to check if an email exists, so the key was bundled and sent to the client.

**Fix:**  
- Removed `SUPABASE_ROLE_KEY` and any `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from `constants.tsx`.  
- Removed `createAdminClient()` and `adminSupabase` from `client.ts`.  
- Added server-only admin client in `lib/supabase/admin.ts` (with `server-only` package) that uses `process.env.SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_`).  
- All server-side code that needed the service role now uses `getServerAdminClient()` from `lib/supabase/admin.ts`.  
- Create-admin “email exists” check moved to a server action `app/actions/check-admin-email.ts` that uses the server admin client; the client component now calls this action instead of using `adminSupabase`.

**Action required:**  
- In your environment (e.g. `.env.local`), use **only** `SUPABASE_SERVICE_ROLE_KEY` for the service role key.  
- Remove `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` if it exists; do not use a `NEXT_PUBLIC_` prefix for the service role key.

---

## 2. Tables missing Row Level Security (RLS) — PARTIALLY FIXED

**Issue:**  
- `email_confirmation_logs` had no RLS, so it was accessible to anon/authenticated roles depending on default Postgres behavior.

**Fix:**  
- Added migration `supabase/migrations/20250308000000_email_confirmation_logs_rls.sql` that runs `ALTER TABLE public.email_confirmation_logs ENABLE ROW LEVEL SECURITY`.  
- With RLS enabled and no policies for `anon`/`authenticated`, only the service role (which bypasses RLS) can access the table.

**Recommendation:**  
- Audit all other tables (e.g. `profiles`, `projects`, `confirmation_links`, `project_comments`, `notifications`, `volunteer_requests`, `agency_requests`, `project_volunteers`, `project_manager_requests`, `rejection_reasons`, `skillsets`, `project_ratings`, `volunteer_ratings`, `project_leave_reasons`, `avatars` storage, etc.) in the Supabase dashboard and ensure each has RLS enabled and appropriate policies. The codebase references many tables; only some are covered by the migrations under `supabase/migrations`.

---

## 3. RLS policies that are too open — NOTED

**Issue:**  
- In `supabase/migrations/20250227000000_system_logs.sql`, policy `service_all_system_logs` uses `USING (true)` and `WITH CHECK (true)` for `TO service_role`.  
- For `service_role` this is acceptable because the service role bypasses RLS anyway; the policy is redundant but not “too open” for normal users.

**No code change.**  
- Ensure no table has a policy for `anon` or `authenticated` with `USING (true)` that would allow unrestricted read/write. If you find any such policy, restrict it to the intended role and conditions.

---

## 4. API routes / Server Actions with no auth check — FIXED

**Issues:**  
- **`/api/send-email`** – No auth; anyone could POST and send arbitrary emails.  
- **`/api/notifications` (GET)** – No auth; accepted `userId` from query and returned that user’s notifications.  
- **`/api/notifications/[id]/read` (PATCH)** – No auth; any client could mark any notification as read by id.  
- **`/api/send-confirmation-email`** – No auth (by design for “resend confirmation”), but it already had rate limiting; service role usage was fixed as in (1).

**Fixes:**  
- **`/api/send-email`** – Now requires header `x-internal-secret` equal to `process.env.INTERNAL_API_SECRET`. Only server-side code (e.g. `services/mail/send-mail-server.ts`) should call this endpoint with that secret.  
- **`/api/notifications` (GET)** – Now uses the session (cookies) via `createServerActionClient` and returns notifications only for the authenticated user (`user_id = user.id`). Removed trust in `userId` query param.  
- **`/api/notifications/[id]/read` (PATCH)** – Now requires authentication and uses the session; update is restricted to the current user (`eq("user_id", user.id)`).

**Action required:**  
- Set `INTERNAL_API_SECRET` in your environment to a long random string and use it only in server-side code that calls `/api/send-email`.

---

## 5. User input not validated before Supabase — FIXED

**Issues:**  
- **`/api/projects/[id]/comments`** – `projectId` from query and `comment_text`, `tagged_users` from body were not validated; risk of invalid UUIDs, oversized text, or invalid arrays.  
- **`/api/projects/[id]/closing-remarks`** – `projectId` and `closing_remarks` were not validated.  
- **`/api/confirm-email`** – Token and payload (`userId`, `email`) were not validated/sanitized.

**Fixes:**  
- **Comments** – Validate `projectId` as UUID; parse and validate `comment_text` (required, max length 5000) and `tagged_users` (array of UUIDs, max 20).  
- **Closing remarks** – Validate `projectId` as UUID; validate `closing_remarks` length (max 10000).  
- **Confirm email** – Validate token presence and length (max 2000); validate `userId` and `email` from payload before use.

---

## 6. Exposed .env variables in client components — FIXED

**Issue:**  
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` was used in constants imported by client-side code, so the service role key was exposed in the client bundle.

**Fix:**  
- Removed all use of `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`. Server-only code uses `SUPABASE_SERVICE_ROLE_KEY` in `lib/supabase/admin.ts`, which is not imported by client components.

**Note:**  
- Other `NEXT_PUBLIC_*` vars (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) are intended for the client; ensure no secrets are in `NEXT_PUBLIC_*`.

---

## 7. Missing auth session checks in middleware — FIXED

**Issues:**  
- Middleware used `getSession()` instead of `getUser()` (session can be stale; Supabase recommends `getUser()` for server-side checks).  
- Dashboard routes were not protected: `protectedPaths` was empty, so unauthenticated users could access `/super-admin/dashboard`, `/admin/dashboard`, `/agency/dashboard`, `/volunteer/dashboard`.

**Fixes:**  
- Introduced `lib/supabase/middleware.ts` with `createMiddlewareClient(request)` using `createServerClient` and request/response cookies.  
- Middleware now uses `getUser()` for the auth check.  
- Dashboard path prefixes (`/super-admin/`, `/admin/`, `/agency/`, `/volunteer/`) now require an authenticated user; otherwise the user is redirected to login.  
- Public routes (e.g. login, register, confirm, static pages) are still allowed without auth.

---

## 8. Direct database queries that bypass RLS — NOTED

**Issue:**  
- Server-side code that uses `getServerAdminClient()` (service role) bypasses RLS by design. This is used only in:  
  - Admin email confirmations API  
  - Admin project volunteers API  
  - Send-confirmation-email API (rate limiting / profile updates)  
  - Server actions: deleteUser, checkEmailExists, reset password flow  
  - loginUserById  

**No change.**  
- These flows are intended to run with elevated privileges after auth/role checks in the app (e.g. admin/super_admin). Ensure every route or action that uses the admin client first checks the user’s role or intent so that only authorized callers can trigger those operations.

---

## Env checklist

- **Do not set** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.  
- **Set** `SUPABASE_SERVICE_ROLE_KEY` (server-only) for admin/server-side Supabase usage.  
- **Set** `INTERNAL_API_SECRET` for internal `/api/send-email` calls from your server.

Run the new migration so RLS is applied on `email_confirmation_logs`:

```bash
supabase db push
# or
supabase migration up
```

After deployment, remove any `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from your hosting env and rotate the service role key in the Supabase dashboard if it was ever exposed.
