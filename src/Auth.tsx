import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ClipboardEvent, type MouseEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { Blobs, EASE, Ecg } from "./Backdrop";
import { emailWaitSeconds } from "./lib/emailLimit";
import { AlertCircle, CircleCheck, Eye, EyeOff, Heart, Loader2, MailCheck } from "lucide-react";
import { api, isDemo } from "./lib/api";
import { BRAND } from "./lib/brand";
import { PASSWORD_RULES, isStrongPassword } from "./lib/password";
import type { Patient } from "./lib/types";

const GoogleG = () => <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>;

/** Split-screen layout: animated brand panel (desktop only, decorative) + the form column. */
function FCard({ cls, depth, delay, sx, sy, children }: { cls: string; depth: number; delay: number; sx: MotionValue<number>; sy: MotionValue<number>; children: ReactNode }) {
  const x = useTransform(sx, (v) => v * depth), y = useTransform(sy, (v) => v * depth);
  return (
    <motion.div className={`fwrap ${cls}`} style={{ x, y }}>
      <motion.div className="fcard" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1, y: [0, -9, 0] }}
        transition={{ opacity: { duration: 0.6, delay }, scale: { duration: 0.7, delay, ease: EASE }, y: { duration: 7 + delay * 3, repeat: Infinity, ease: "easeInOut", delay: delay + 0.7 } }}>{children}</motion.div>
    </motion.div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 }), sy = useSpring(my, { stiffness: 60, damping: 18 });
  const move = (e: MouseEvent<HTMLElement>) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); };
  const leave = () => { mx.set(0); my.set(0); };
  return (
    <main className="auth">
      <aside className="auth-art" aria-hidden="true" onMouseMove={move} onMouseLeave={leave}>
        <Blobs art /><div className="dots" />
        <motion.span className="ring r1" animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.15, 0.5] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.span className="ring r2" animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.1, 0.35] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        <Ecg className="art-ecg" />
        <motion.div className="art-top" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}><span className="art-seal"><img src={BRAND.logo} alt="" /></span><span className="wordmark">KioskVitalCare</span></motion.div>
        <div className="art-stage">
          <FCard cls="c1" depth={26} delay={0.15} sx={sx} sy={sy}><p>Latest health check</p><b>36.7 °C</b><span className="fpill">✓ In usual range</span></FCard>
          <FCard cls="c4" depth={40} delay={0.3} sx={sx} sy={sy}><p>Pulse</p><b className="beat-row"><motion.span animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }} style={{ display: "inline-flex" }}><Heart size={17} fill="#418B65" stroke="#418B65" /></motion.span>72 <small>bpm</small></b></FCard>
          <FCard cls="c5" depth={34} delay={0.45} sx={sx} sy={sy}>
            <div className="ox"><svg viewBox="0 0 44 44" width="52" height="52"><circle cx="22" cy="22" r="18" fill="none" stroke="#D9EBDF" strokeWidth="5" />
              <motion.circle cx="22" cy="22" r="18" fill="none" stroke="#418B65" strokeWidth="5" strokeLinecap="round" transform="rotate(-90 22 22)" initial={{ pathLength: 0 }} animate={{ pathLength: 0.98 }} transition={{ duration: 1.8, delay: 0.9, ease: "easeOut" }} /></svg>
              <div><p>Oxygen</p><b>98%</b></div></div>
          </FCard>
          <FCard cls="c2" depth={20} delay={0.6} sx={sx} sy={sy}><p>Temperature over time</p>
            <svg viewBox="0 0 200 60"><motion.path d="M0 40 C20 30 30 46 50 36 S80 20 100 30 S140 48 160 30 S190 20 200 24" fill="none" stroke="#418B65" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: 1, ease: "easeInOut" }} />
              <motion.circle cx="200" cy="24" r="4.5" fill="#fff" stroke="#418B65" strokeWidth="2.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.6 }} /></svg></FCard>
          <FCard cls="c3" depth={46} delay={0.75} sx={sx} sy={sy}><p>Blood pressure</p><b>118/76 <small>mmHg</small></b></FCard>
        </div>
        <motion.p className="art-copy" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: EASE }}>Your health checks, always with you.</motion.p>
      </aside>
      <div className="auth-main"><Blobs /><div className="dots" /><div className="login-in">{children}</div></div>
    </main>
  );
}

type AuthStep = "form" | "signup-otp" | "forgot-email" | "forgot-otp" | "forgot-password" | "reset-done";

/** Six separate one-character boxes with keyboard navigation and clipboard support. */
function OtpInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  const update = (next: string, focusIndex?: number) => {
    onChange(next.slice(0, 6));
    if (focusIndex !== undefined) refs.current[focusIndex]?.focus();
  };
  const paste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    update(digits, Math.min(digits.length, 5));
  };
  const keyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index]) update(value.slice(0, index) + value.slice(index + 1), index);
      else if (index > 0) { refs.current[index - 1]?.focus(); update(value.slice(0, -1)); }
    } else if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    else if (event.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
  };
  return <div className="otp-grid" role="group" aria-label="Six-digit verification code">
    {Array.from({ length: 6 }, (_, index) => <input key={index} ref={(el) => { refs.current[index] = el; }} className="text-input otp-digit" aria-label={`Digit ${index + 1}`} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} maxLength={1} value={value[index] ?? ""}
      onChange={(e) => { const raw = e.target.value.replace(/\D/g, ""); if (raw.length > 1) update(raw.slice(0, 6), Math.min(raw.length, 5)); else { const next = value.split(""); next[index] = raw; update(next.join(""), raw && index < 5 ? index + 1 : undefined); } }} onKeyDown={(e) => keyDown(e, index)} onPaste={paste} />)}
  </div>;
}

function PasswordRules({ password, confirm, showConfirm = true }: { password: string; confirm: string; showConfirm?: boolean }) {
  const touched = password.length > 0;
  return <div className="password-feedback" aria-live="polite">
    <div className="password-rules">{PASSWORD_RULES.map((rule) => <span key={rule.label} className={rule.test(password) ? "rule-pass" : "rule-pending"}><CircleCheck className="password-rule-icon" size={15} strokeWidth={2} aria-hidden="true" />{rule.label}</span>)}</div>
    {showConfirm && confirm.length > 0 && <p className={password === confirm ? "rule-pass" : "rule-error"}>{password === confirm ? "✓ Passwords match" : "Passwords do not match."}</p>}
    {touched && !isStrongPassword(password) && <p className="hint">Complete all password requirements before continuing.</p>}
  </div>;
}

export function Auth({ mode, onSuccess }: { mode: "signin" | "signup"; onSuccess: (p: Patient) => void }) {
  const up = mode === "signup";
  const [step, setStep] = useState<AuthStep>("form");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState(""); const [show, setShow] = useState(false); const [showNewPassword, setShowNewPassword] = useState(false); const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [info, setInfo] = useState("");
  // Seconds before another email may be requested (counts down while the code screen is open).
  const [wait, setWait] = useState(0);
  useEffect(() => { setWait(emailWaitSeconds()); const t = setInterval(() => setWait(emailWaitSeconds()), 1000); return () => clearInterval(t); }, [step]);
  const run = async (fn: () => Promise<void>) => { if (busy) return; setBusy(true); setError(""); setInfo(""); try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(false); } };
  const heading = step === "signup-otp" ? "Verify your email" : step === "forgot-email" ? "Reset your password" : step === "forgot-otp" ? "Enter verification code" : step === "forgot-password" ? "Create a new password" : step === "reset-done" ? "Password updated" : up ? "Create your account" : "Welcome back";

  const submit = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    if (up) {
      if (!isStrongPassword(password)) throw new Error("Your password does not meet all the security requirements.");
      if (password !== confirm) throw new Error("Your passwords do not match.");
      await api.signUp(name.trim(), email.trim(), password);
      setOtp(""); setStep("signup-otp"); setInfo("A six-digit verification code has been sent to your email.");
    } else onSuccess(await api.signIn(email.trim(), password));
  }); };
  const google = () => void run(async () => { const p = await api.google(); if (p) onSuccess(p); });
  const sendReset = (e: FormEvent) => { e.preventDefault(); void run(async () => { if (!email.trim()) throw new Error("Enter your email address."); await api.resetPassword(email.trim()); setOtp(""); setStep("forgot-otp"); setInfo("If an account exists for that email, a six-digit code has been sent."); }); };
  const verifyOtp = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    if (!/^\d{6}$/.test(otp)) throw new Error("Enter all six digits of the code.");
    if (step === "signup-otp") onSuccess(await api.verifySignupOtp(email.trim(), otp, name.trim()));
    else { await api.verifyRecoveryOtp(email.trim(), otp); setStep("forgot-password"); setPassword(""); setConfirm(""); setInfo("Email verified. Choose your new password."); }
  }); };
  const saveNewPassword = (e: FormEvent) => { e.preventDefault(); void run(async () => {
    if (!isStrongPassword(password)) throw new Error("Your password does not meet all the security requirements.");
    if (password !== confirm) throw new Error("Your passwords do not match.");
    await api.updatePassword(password); setPassword(""); setConfirm(""); setStep("reset-done"); setInfo("Your password has been changed. You can now sign in.");
  }); };
  const resend = () => void run(async () => { if (step === "signup-otp") await api.resendSignupOtp(email.trim()); else await api.resetPassword(email.trim()); setOtp(""); setInfo("A new verification code has been sent."); });
  // The recovery flow is an internal step inside the sign-in screen. Returning
  // to sign-in must reset this component's step instead of navigating to the
  // same hash route (which would not remount Auth).
  const backToSignIn = () => {
    setStep("form"); setOtp(""); setPassword(""); setConfirm("");
    setShowNewPassword(false); setShowConfirmNewPassword(false);
    setError(""); setInfo("");
  };

  return <Shell>
    <div className={`login-head${step === "reset-done" ? " reset-complete-head" : ""}`}><a href="#/"><img src={BRAND.logo} alt={BRAND.logoAlt} /></a><h1>{heading}</h1>
      <p>{step === "signup-otp" || step === "forgot-otp" ? <>Enter the six-digit code sent to <b>{email}</b>.</> : step === "forgot-email" ? "Enter the email address associated with your account." : step === "forgot-password" ? "Choose a strong password you haven't used before." : step === "reset-done" ? "Your account is ready to use with your new password." : up ? "See your health check results anywhere." : BRAND.subtitle}</p>
    </div>

    {step === "form" && <form className="form" onSubmit={submit} noValidate>
      {up && <div><label htmlFor="name">Full name</label><input id="name" className="text-input" placeholder="Your full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>}
      <div><label htmlFor="email">Email</label><input id="email" className="text-input" placeholder="you@example.com" type="email" inputMode="email" autoComplete={up ? "email" : "username"} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><label htmlFor="pw">Password</label><div style={{ position: "relative" }}><input id="pw" className="text-input password-with-toggle" placeholder={up ? "Create a password" : "Enter your password"} style={{ paddingRight: 52 }} type={show ? "text" : "password"} autoComplete={up ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="button" className="icon-btn" style={{ position: "absolute", right: 2, top: 2 }} onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        {up ? <PasswordRules password={password} confirm={confirm} showConfirm={false} /> : <button type="button" className="link" style={{ minHeight: 36 }} onClick={() => { setError(""); setStep("forgot-email"); }}>Forgot password?</button>}</div>
      {up && <div><label htmlFor="confirm-pw">Confirm password</label><input id="confirm-pw" className="text-input" type="password" autoComplete="new-password" placeholder="Re-enter your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />{confirm && <p className={confirm === password ? "rule-pass" : "rule-error"}>{confirm === password ? "✓ Passwords match" : "Passwords do not match."}</p>}</div>}
      {error && <p className="note bad" role="alert"><AlertCircle size={16} aria-hidden="true" />{error}</p>}{info && <p className="note ok" role="status">{info}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy || !email || !password || (up && (!name.trim() || !confirm || password !== confirm || !isStrongPassword(password)))}>{busy ? <><Loader2 size={18} className="spin" />{up ? "Creating account…" : "Signing in…"}</> : up ? "Create account" : "Sign in"}</button>
      <div className="or">or</div><button type="button" className="btn btn-google btn-block" onClick={google} disabled={busy}><GoogleG />Continue with Google</button>
    </form>}

    {(step === "signup-otp" || step === "forgot-otp") && <form className="form" onSubmit={verifyOtp} noValidate>
      <OtpInput value={otp} onChange={setOtp} />
      {error && <p className="note bad" role="alert"><AlertCircle size={16} />{error}</p>}{info && <p className="note ok" role="status">{info}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy || otp.length !== 6}>{busy ? <><Loader2 size={18} className="spin" />Verifying…</> : "Verify code"}</button>
      <p className="switch">Didn't receive a code? <button type="button" className="link" onClick={resend} disabled={busy || wait > 0}>{wait > 0 ? `Resend code in ${wait}s` : "Resend code"}</button></p>
      <button type="button" className="link" onClick={() => { setStep(step === "signup-otp" ? "form" : "forgot-email"); setOtp(""); setError(""); }}>Back</button>
    </form>}

    {step === "forgot-email" && <form className="form" onSubmit={sendReset} noValidate>
      <label htmlFor="reset-email">Email address</label><input id="reset-email" className="text-input" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <p className="note bad" role="alert">{error}</p>}{info && <p className="note ok" role="status">{info}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy || !email.trim()}>{busy ? "Sending…" : "Send OTP"}</button><button type="button" className="link" onClick={() => setStep("form")}>Back to sign in</button>
    </form>}

    {step === "forgot-password" && <form className="form" onSubmit={saveNewPassword} noValidate>
      <div><label htmlFor="new-pw">New password</label><div style={{ position: "relative" }}><input id="new-pw" className="text-input password-with-toggle" style={{ paddingRight: 52 }} type={showNewPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a new password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="button" className="icon-btn" style={{ position: "absolute", right: 2, top: 2 }} onClick={() => setShowNewPassword((v) => !v)} aria-label={showNewPassword ? "Hide new password" : "Show new password"} aria-pressed={showNewPassword}>{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        <PasswordRules password={password} confirm={confirm} showConfirm={false} /></div>
      <div><label htmlFor="new-pw-confirm">Confirm new password</label><div style={{ position: "relative" }}><input id="new-pw-confirm" className="text-input password-with-toggle" style={{ paddingRight: 52 }} type={showConfirmNewPassword ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter your new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <button type="button" className="icon-btn" style={{ position: "absolute", right: 2, top: 2 }} onClick={() => setShowConfirmNewPassword((v) => !v)} aria-label={showConfirmNewPassword ? "Hide confirmed password" : "Show confirmed password"} aria-pressed={showConfirmNewPassword}>{showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
        {confirm && <p className={confirm === password ? "rule-pass" : "rule-error"}>{confirm === password ? "✓ Passwords match" : "Passwords do not match."}</p>}</div>
      {error && <p className="note bad" role="alert">{error}</p>}{info && <p className="note ok" role="status">{info}</p>}
      <button className="btn btn-primary btn-block" type="submit" disabled={busy || !isStrongPassword(password) || !confirm || confirm !== password}>{busy ? "Saving…" : "Save new password"}</button>
    </form>}

    {step === "reset-done" && <div className="form reset-success" role="status"><MailCheck size={44} color="var(--accent)" aria-hidden="true" /><button className="btn btn-primary btn-block" type="button" onClick={backToSignIn}>Back to sign in</button></div>}

    {step === "form" && <><p className="fine">By continuing, you agree to our <a href="#/terms">Terms</a> and <a href="#/privacy">Privacy Policy</a>.</p><p className="switch">{up ? <>Already have an account? <a href="#/signin">Sign in</a></> : <>New here? <a href="#/signup">Create an account</a></>}</p>{isDemo && <p className="fine">Demo mode: use OTP <b>123456</b>. Sample data only.</p>}</>}
  </Shell>;
}

/** Shown once, right after a first-time Google sign-in. */
export function Welcome({ me, onDone }: { me: Patient; onDone: (p: Patient) => void }) {
  const [name, setName] = useState(me.name.includes("@") ? "" : me.name);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); const n = name.trim(); if (!n || busy) return; setBusy(true); setError("");
    try { await api.confirmName(n); onDone({ ...me, name: n.slice(0, 80), needsName: false }); } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); } finally { setBusy(false); }
  }
  return (
    <Shell>
      <div className="login-head"><img src={BRAND.logo} alt={BRAND.logoAlt} /><h1>Welcome</h1><p>What should we call you?</p></div>
      <form className="form" onSubmit={submit} noValidate>
        <div><label htmlFor="dn">Display name</label><input id="dn" className="text-input" autoComplete="name" autoFocus maxLength={80} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!error} />
          <p className="hint">This is the name shown on your account. You can change it later in Profile.</p></div>
        {error && <p className="note bad" role="alert"><AlertCircle size={16} aria-hidden="true" />{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy || !name.trim()}>{busy ? <Loader2 size={18} className="spin" aria-label="Saving" /> : "Continue"}</button>
      </form>
    </Shell>
  );
}
