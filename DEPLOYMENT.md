# SkillDrive — Deployment Guide

Stack: React (Vite) + TypeScript + Tailwind · Supabase (Postgres, Auth, Storage, Edge Functions) · Stripe Connect · Resend · Vercel.

## 1. Verify locally

```bash
npm install
npm test          # 15 unit tests (logbook 3-for-1, 24h cancellation policy, telemetry geometry)
npm run build     # tsc + vite production build
```

## 2. Database

Apply all migrations (includes `20260710000000_platform_completion.sql` — reviews, packages, telemetry, support tickets, audit logs, NSW compliance, logbook view):

```bash
supabase link --project-ref <YOUR_PROJECT_REF>
supabase db push
```

Post-migration checklist:
- **Auth hook**: in Supabase Dashboard → Authentication → Hooks, enable the *Custom Access Token* hook pointing at `public.custom_access_token` (injects `user_role` into JWTs).
- **pg_cron** (recommended): enable the extension, then re-run the `DO` block at the end of the completion migration (or call `SELECT public.suspend_expired_instructor_documents();` manually) so expired DI licences / WWCC / rego auto-suspend instructors daily.
- Schedule the 24-hour lesson reminders (hourly):
  ```sql
  select cron.schedule('lesson-reminders', '0 * * * *', $$
    select net.http_post(
      url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-lesson-reminders',
      headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
    );
  $$);
  ```

## 3. Edge Functions

```bash
supabase functions deploy create-connect-account create-checkout-session stripe-webhook \
  cancel-booking reschedule-booking complete-lesson send-lesson-reminders send-welcome-email \
  search-instructors get-available-slots get-instructor get-bookings get-user-profile \
  admin-actions invite-instructor verify-id

# stripe-webhook must skip JWT verification (Stripe signs requests instead):
supabase functions deploy stripe-webhook --no-verify-jwt
```

### Function secrets

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  RESEND_API_KEY=re_... \
  RESEND_FROM="SkillDrive <notifications@skilldrive.com.au>"
```

(`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically.)

### Stripe configuration
- Connect: Express accounts, country AU. Payments use the **escrow model** — the learner pays the platform; `complete-lesson` transfers the payout (minus 15% commission) to the instructor after the lesson.
- Webhook endpoint: `https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook`, events: `checkout.session.completed`, `charge.refunded`, `account.updated`.

### Resend configuration
- Verify the `skilldrive.com.au` sending domain in Resend, or override `RESEND_FROM` with a verified address.

## 4. Frontend on Vercel

```bash
vercel link
vercel --prod
```

Environment variables (Vercel → Project → Settings → Environment Variables):

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<PROJECT_REF>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | project anon key |

Build settings: framework *Vite*, build `npm run build`, output `dist` (already encoded in `vercel.json`).

## 5. Push to main

```bash
git checkout main
git merge claude/project-completion-3yv2y6
git push origin main
```

## Production go-live checklist

- [ ] Migrations applied, `learner_logbook` view returns rows for a test learner
- [ ] Custom access token hook enabled
- [ ] Stripe webhook signing secret set; test event delivers 200
- [ ] Resend domain verified; welcome + booking emails arriving
- [ ] pg_cron jobs scheduled (document expiry sweep, lesson reminders)
- [ ] An admin user exists (`update public.profiles set role='admin' where email='...'`)
- [ ] `npm test` and `npm run build` green on the deploy commit
