/**
 * Client-side brake on emails (signup codes, password-reset codes, resends).
 * Each one is a billable SMTP send, so a browser may request at most one every
 * COOLDOWN_SECONDS and MAX_PER_HOUR per hour.
 *
 * This only stops accidental or casual spamming. It can be bypassed by anyone calling the API
 * directly, so the real limits must also be set in Supabase (Authentication > Rate Limits) and
 * with your SMTP provider. See SETUP_EMAIL_LIMITS.md.
 */
export const COOLDOWN_SECONDS = 60;
export const MAX_PER_HOUR = 5;

const KEY = "crt-email-requests-v1";
const HOUR_MS = 3_600_000;
let memory: number[] = []; // used when localStorage is unavailable

function recent(): number[] {
  const now = Date.now();
  let stored: number[] = memory;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (Array.isArray(raw)) stored = raw.filter((n): n is number => typeof n === "number");
  } catch { /* storage blocked: fall back to memory */ }
  return stored.filter((t) => t <= now && now - t < HOUR_MS);
}

function save(list: number[]) {
  memory = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

/** Seconds until another email may be requested (0 = allowed now). */
export function emailWaitSeconds(): number {
  const list = recent();
  if (!list.length) return 0;
  const now = Date.now();
  const cooldown = COOLDOWN_SECONDS * 1000 - (now - Math.max(...list));
  const capped = list.length >= MAX_PER_HOUR ? HOUR_MS - (now - Math.min(...list)) : 0;
  return Math.max(0, Math.ceil(Math.max(cooldown, capped) / 1000));
}

/** Call right before sending an email. Throws a patient-friendly error when blocked; otherwise records the send. */
export function claimEmailSlot(): void {
  const wait = emailWaitSeconds();
  if (wait > 0) {
    const list = recent();
    if (list.length >= MAX_PER_HOUR && wait > COOLDOWN_SECONDS)
      throw new Error(`Too many email requests. Please try again in ${Math.ceil(wait / 60)} minutes.`);
    throw new Error(`Please wait ${wait} second${wait === 1 ? "" : "s"} before requesting another email.`);
  }
  save([...recent(), Date.now()]);
}
