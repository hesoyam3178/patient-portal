# Health Kiosk Patient Portal

React + TypeScript + Supabase, same stack and design tokens as `cloud-portal`. Mobile-first; top bar with a dropdown menu on phones, sidebar from 900px.

1. Run `cloud/supabase/migration_003_patient_portal.sql` (after schema.sql and migration_002). It adds `profiles.kiosk_user_id` and a `my_results` view.
2. Link each patient: `update public.profiles set full_name='...', kiosk_user_id='2458' where id='<auth user uuid>';`
3. `cp .env.example .env.local`, fill in the URL and anon key. Leave blank for demo mode (mock data in `src/lib/demo.ts`, banner shown).
4. `npm install && npm run dev`

Privacy: the app only reads the `my_results` view, which filters by `auth.uid()` on the server and hides staff notes and review fields.

## Accounts and Google sign-in
- Sign up, sign in and forgot password use Supabase Auth. In Auth > Providers > Email, choose whether to require email confirmation; email confirmation must be enabled for the OTP signup flow.
- Run `cloud/supabase/migration_004_patient_accounts.sql` so patients can edit their own name safely.
- Google: enable it under Supabase > Auth > Providers > Google (paste your Google OAuth client ID and secret). Add your site URL to Auth > URL Configuration > Redirect URLs, and add the Supabase callback URL to your Google OAuth client.
- New accounts see no results until staff link their Kiosk User ID (`update public.profiles set kiosk_user_id='...' where id='...'`).

## Loading skeletons
Shown only on slow connections (loading over ~0.7s, or 2G/3G/data-saver). In demo mode, open the site with `?slow` (e.g. `/?slow#/signin`) to preview them.

## Theme
Light mode only, using the clinical green palette (tokens at the top of `src/styles.css`). There is no dark theme or theme switch.


## Email OTP authentication setup

The sign-up and password-recovery screens use Supabase email OTPs. Configure the Supabase project before testing these flows:

1. In **Authentication → Providers → Email**, enable the Email provider and turn on **Confirm email**. The app expects signup to create an unconfirmed user and send a verification code.
2. In **Authentication → Email Templates → Confirm signup**, use the OTP token variable `{{ .Token }}` in the message body (for example: `Your verification code is {{ .Token }}.`). Do not use only `{{ .ConfirmationURL }}`; this UI verifies the six-digit code with `verifyOtp`.
3. In **Authentication → Email Templates → Reset Password**, also include `{{ .Token }}` (for example: `Your password reset code is {{ .Token }}.`). The recovery screen verifies this code with `verifyOtp` using `type: "recovery"`.
4. Set the OTP expiry and email rate limits under **Authentication → Settings** to values appropriate for your deployment. The UI expects six digits.
5. Set the project's password policy to at least 8 characters. The client additionally checks uppercase, lowercase, numeric, and special characters before signup or password update.
6. Configure the project URL and allowed site URLs in **Authentication → URL Configuration**.
7. Add the project URL and anon/publishable key to `.env.local` using the keys in `.env.example`, then restart the Vite dev server. Never put a Supabase service-role key in the browser app.

### Authentication behavior

- **Sign up:** validates password strength and confirmation, calls `auth.signUp`, then displays the signup OTP screen. A successful `type: "signup"` verification establishes the session and loads the patient profile.
- **Forgot password:** calls `auth.resetPasswordForEmail`, verifies the six-digit code with `type: "recovery"`, then calls `auth.updateUser({ password })` after the recovery session is established.
- **Resend:** signup uses `auth.resend({ type: "signup", email })`; recovery sends a fresh reset email. Supabase rate limits still apply.
- **Demo mode:** when Supabase environment variables are not configured, use `123456` as the OTP. This is only a local demo behavior and does not authenticate with Supabase.
