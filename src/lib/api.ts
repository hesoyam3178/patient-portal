import { isConfigured, supabase } from "./supabase";
import { demoNotices, demoPatient, demoResults } from "./demo";
import { claimEmailSlot } from "./emailLimit";
import type { Notice, Patient, Result } from "./types";

export const isDemo = !isConfigured;
/** Demo latency. Add ?slow to the URL (e.g. /?slow#/signin) to simulate a slow connection and preview the loading skeletons. */
let demoPinSetAt: string | null = null;
let demoNoticeStore: Notice[] | null = null;
const wait = (ms = 450) => new Promise((r) => setTimeout(r, new URLSearchParams(window.location.search).has("slow") ? 3000 : ms));

async function loadPatient(): Promise<Patient | null> {
  await supabase!.auth.getSession(); // waits for any OAuth code exchange to finish
  const { data: auth } = await supabase!.auth.getUser();
  if (!auth.user) return null;
  const meta = auth.user.user_metadata ?? {};
  const { data: p } = await supabase!.from("profiles").select("full_name, kiosk_user_id").eq("id", auth.user.id).single();
  return { id: auth.user.id, email: auth.user.email ?? "", name: p?.full_name || meta.full_name || meta.name || auth.user.email || "Patient", kioskUserId: p?.kiosk_user_id ?? null,
    needsName: (auth.user.app_metadata?.provider === "google" || auth.user.identities?.some((i) => i.provider === "google")) && !meta.name_confirmed };
}

export const api = {
  async restore(): Promise<Patient | null> { if (isDemo) return null; try { return await loadPatient(); } catch { return null; } },
  async signIn(email: string, password: string): Promise<Patient> {
    if (isDemo) { await wait(); return demoPatient; }
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) throw new Error("The email or password is incorrect.");
    const p = await loadPatient();
    if (!p) throw new Error("Sign-in failed. Please try again.");
    return p;
  },
  /** Starts email-OTP signup. Supabase must have email confirmations enabled. */
  async signUp(name: string, email: string, password: string): Promise<void> {
    claimEmailSlot();
    if (isDemo) { await wait(); return; }
    const { data, error } = await supabase!.auth.signUp({ email, password, options: { data: { full_name: name } } });
    if (error) throw new Error(/registered|exists/i.test(error.message) ? "An account with this email already exists. Try signing in." : error.message);
    if (data.user?.identities?.length === 0) throw new Error("An account with this email already exists. Try signing in.");
    // A session means email confirmation is disabled, so no OTP challenge was created.
    if (data.session) {
      await supabase!.auth.signOut();
      throw new Error("Email OTP confirmation is disabled in Supabase. Enable Confirm email in Authentication settings.");
    }
  },
  async verifySignupOtp(email: string, token: string, name = ""): Promise<Patient> {
    if (isDemo) { await wait(250); if (token !== "123456") throw new Error("Invalid code. For demo mode, use 123456."); return { ...demoPatient, email, name: name || demoPatient.name }; }
    const { error } = await supabase!.auth.verifyOtp({ email, token, type: "signup" });
    if (error) throw new Error(/expired/i.test(error.message) ? "That code has expired. Request a new one." : "That code is invalid. Check it and try again.");
    const patient = await loadPatient();
    if (!patient) throw new Error("Your email was verified, but we couldn't load your account. Please sign in.");
    return patient;
  },
  async resendSignupOtp(email: string): Promise<void> {
    claimEmailSlot();
    if (isDemo) { await wait(200); return; }
    const { error } = await supabase!.auth.resend({ type: "signup", email });
    if (error) throw new Error("We couldn't resend the code. Please wait a moment and try again.");
  },
  /** Real mode redirects to Google and back (returns null). Demo mode signs in the sample patient. */
  async google(): Promise<Patient | null> {
    if (isDemo) { await wait(); return { ...demoPatient, needsName: true }; }
    const { error } = await supabase!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + import.meta.env.BASE_URL } });
    if (error) throw new Error("Google sign-in isn’t available right now.");
    return null;
  },
  async updateName(name: string) {
    if (isDemo) { await wait(200); return; }
    const { error } = await supabase!.rpc("update_my_name", { n: name });
    if (error) throw new Error("We couldn’t update your name.");
  },
  /** First-time Google sign-in: save the chosen display name and mark it confirmed so we don't ask again. */
  async confirmName(name: string) {
    await api.updateName(name);
    if (!isDemo) { const { error } = await supabase!.auth.updateUser({ data: { full_name: name, name_confirmed: true } }); if (error) throw new Error("We couldn’t save your name."); }
  },
  /** Verify the current password before changing it. Re-authenticating with
   * signInWithPassword ensures the supplied password belongs to this account. */
  async changePassword(email: string, currentPassword: string, newPassword: string) {
    if (isDemo) {
      await wait(250);
      if (currentPassword !== "Demo@123") throw new Error("Your current password is incorrect. For demo mode, use Demo@123.");
      return;
    }
    const { error: signInError } = await supabase!.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) throw new Error("Your current password is incorrect. Please try again.");
    const { error: updateError } = await supabase!.auth.updateUser({ password: newPassword });
    if (updateError) throw new Error(updateError.message || "We couldn't update your password. Please try again.");
  },
  /** Used by the email-OTP recovery flow after the recovery code is verified. */
  async updatePassword(password: string) {
    if (isDemo) { await wait(200); return; }
    const { error } = await supabase!.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },
  /** When the signed-in patient last set their kiosk PIN, or null if they have none. The PIN itself is never readable. */
  async kioskPinStatus(): Promise<string | null> {
    if (isDemo) { await wait(150); return demoPinSetAt; }
    const { data, error } = await supabase!.rpc("my_kiosk_pin_status");
    return error ? null : ((data as string | null) ?? null);
  },
  /** Sets or changes the kiosk PIN. The server stores only a hash and re-checks the PIN rules. */
  async setKioskPin(pin: string): Promise<void> {
    if (isDemo) { await wait(250); demoPinSetAt = new Date().toISOString(); return; }
    const { error } = await supabase!.rpc("set_kiosk_pin", { p_pin: pin });
    if (error) throw new Error(error.code === "22023" ? error.message : "We couldn’t save your PIN. Please try again.");
  },
  async signOut() { if (supabase) await supabase.auth.signOut(); },
  /** Server-side filtered: the `my_results` view only ever returns the signed-in patient's own rows. */
  async myResults(): Promise<Result[]> {
    if (isDemo) { await wait(); return demoResults().sort((a, b) => b.recorded_at.localeCompare(a.recorded_at)); }
    const { data, error } = await supabase!.from("my_results").select("*").order("recorded_at", { ascending: false }).limit(500);
    if (error) throw new Error("We couldn’t load your results. Please try again.");
    return data as Result[];
  },
  /** Reviews staff have sent to this patient, newest first. RLS only returns the signed-in patient's own rows. */
  async myNotices(): Promise<Notice[]> {
    if (isDemo) { await wait(200); return [...(demoNoticeStore ??= demoNotices())].sort((a, b) => b.reviewed_at.localeCompare(a.reviewed_at)); }
    const { data, error } = await supabase!.from("patient_notifications").select("id, result_id, staff_note, reviewed_at, created_at, read_at").order("reviewed_at", { ascending: false }).limit(200);
    if (error) throw new Error("We couldn’t load your notifications.");
    return data as Notice[];
  },
  /** Marks the given notifications as read. Patients can only ever change `read_at` on their own rows (column grant + RLS). */
  async markNoticesRead(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const now = new Date().toISOString();
    if (isDemo) { demoNoticeStore = (demoNoticeStore ??= demoNotices()).map((n) => (ids.includes(n.id) && !n.read_at ? { ...n, read_at: now } : n)); return; }
    const { error } = await supabase!.from("patient_notifications").update({ read_at: now }).in("id", ids).is("read_at", null);
    if (error) throw new Error("We couldn’t update your notifications.");
  },
  /** Calls `onChange` when a review arrives or changes (Realtime). Returns an unsubscribe function. Demo mode never changes. */
  watchNotices(patientId: string, onChange: () => void): () => void {
    if (isDemo) return () => {};
    const channel = supabase!.channel(`notices-${patientId}`).on("postgres_changes", { event: "*", schema: "public", table: "patient_notifications", filter: `patient_id=eq.${patientId}` }, onChange).subscribe();
    return () => void supabase!.removeChannel(channel);
  },
  async resetPassword(email: string) {
    claimEmailSlot();
    if (isDemo) { await wait(300); return; }
    const { error } = await supabase!.auth.resetPasswordForEmail(email);
    if (error) throw new Error("We couldn't send the code. Please check the email and try again.");
  },
  async verifyRecoveryOtp(email: string, token: string): Promise<void> {
    if (isDemo) { await wait(250); if (token !== "123456") throw new Error("Invalid code. For demo mode, use 123456."); return; }
    const { error } = await supabase!.auth.verifyOtp({ email, token, type: "recovery" });
    if (error) throw new Error(/expired/i.test(error.message) ? "That code has expired. Request a new one." : "That code is invalid. Check it and try again.");
  },
};
