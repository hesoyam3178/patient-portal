# Limiting SMTP email (avoid over-charges)

Emails sent by the patient portal: signup verification code, password-reset code, and "Resend code".
Every one is a billable send through your SMTP provider. Use all three layers below; the app
limit alone is not enough because anyone can call the Supabase API directly.

## Layer 1: in the app (already added)
`src/lib/emailLimit.ts`: one email per 60 s and at most 5 per hour per browser. The Resend button
shows a countdown. Change `COOLDOWN_SECONDS` / `MAX_PER_HOUR` at the top of that file.

## Layer 2: Supabase (this is the one attackers cannot skip)
Supabase dashboard > Authentication. Names can differ slightly between dashboard versions.

1. **Rate Limits** > "Rate limit for sending emails": with custom SMTP the default is 30 per hour for
   the whole project. Lower it to what you really need (e.g. 10-20 per hour for a school clinic).
2. **Rate Limits** > sign-ups/sign-ins and token verifications per IP: keep the defaults or lower them.
3. **SMTP Settings** > "Minimum interval between emails being sent" (per user): keep at 60 seconds or higher.
4. **Attack Protection** > turn on CAPTCHA (Cloudflare Turnstile or hCaptcha). This stops bots from
   creating accounts and triggering emails. It needs a small change in the sign-up / forgot-password
   forms to send the captcha token; ask and I will add it.
5. **Sign In / Providers** > Email: keep "Confirm email" on, and set OTP expiry to 10 minutes or less.

## Layer 3: your SMTP provider
Set a hard cap there so a bug or attack cannot run up a bill:
- a daily/monthly sending quota, or a spending limit (most providers offer both);
- email/usage alerts at 50% and 80%;
- sending only from your verified domain.

## Check
Request a code, then press Resend straight away: the button should be disabled with "Resend code in Ns".
After 5 requests in an hour the app shows "Too many email requests".
