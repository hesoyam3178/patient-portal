import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, ChevronLeft, ChevronRight, CircleAlert, CircleCheck, ClipboardList, LogOut, Minus, TriangleAlert, KeyRound, Pencil, CircleHelp, ShieldCheck, FileText, Eye, EyeOff, Hash } from "lucide-react";
import { motion } from "motion/react";
import { api } from "./lib/api";
import { EASE } from "./Backdrop";
import { FLAG_SUMMARY, FLAG_TONE, M, TONE_LABEL, TREND, fmtDate, fmtTime, greeting, summaryLine, withUnit, type Metric, type Tone } from "./lib/health";
import { PASSWORD_RULES, isStrongPassword } from "./lib/password";
import { PIN_LENGTH, pinProblem } from "./lib/pin";
import type { Patient, Result } from "./lib/types";

const rise = (i = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: Math.min(i, 8) * 0.06, ease: EASE } });
const go = (to: string) => { window.location.hash = to; };
const ICON = { ok: CircleCheck, warn: CircleAlert, bad: TriangleAlert, none: Minus };
export const Banner = ({ children }: { children: ReactNode }) => <div className="banner" role="note"><AlertCircle size={18} aria-hidden="true" /><span>{children}</span></div>;
const Status = ({ tone, text }: { tone: Tone; text?: string }) => { const I = ICON[tone]; return <span className={`st ${tone}`}><I size={15} aria-hidden="true" />{text ?? TONE_LABEL[tone]}</span>; };
const Note = ({ tone, children }: { tone: Tone; children: ReactNode }) => { const I = ICON[tone]; return <p className={`note ${tone}`}><I size={18} aria-hidden="true" /><span>{children}</span></p>; };
const Head = ({ title, sub, eyebrow }: { title: string; sub?: string; eyebrow?: string }) => <div className="head">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{sub && <p>{sub}</p>}</div>;
/** True on a slow link (2G/3G or data-saver) right away, otherwise only once loading has taken longer than `ms`. Fast loads never flash a skeleton. */
function useSlowGate(ms = 700) {
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
  const slowLink = !!conn && (!!conn.saveData || ["slow-2g", "2g", "3g"].includes(conn.effectiveType ?? ""));
  const [on, setOn] = useState(slowLink);
  useEffect(() => { if (on) return; const t = setTimeout(() => setOn(true), ms); return () => clearTimeout(t); }, [on, ms]);
  return on;
}
const Skel = ({ h = 120 }: { h?: number }) => { const slow = useSlowGate(); return slow ? <div className="skeleton" style={{ height: h, marginBottom: 12 }} role="status" aria-label="Loading" /> : null; };
const Line = ({ w = "100%", h = 14 }: { w?: string; h?: number }) => <div className="skeleton" style={{ width: w, height: h, borderRadius: 8 }} />;
function DashSkel() {
  const slow = useSlowGate(); if (!slow) return null;
  return <div className="card hero" role="status" aria-label="Loading your results" style={{ display: "grid", gap: 16 }}>
    <Line w="38%" h={12} /><Line w="72%" h={26} /><Line h={52} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "4px 0" }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ display: "grid", gap: 8 }}><Line w="55%" h={12} /><Line w="45%" h={26} /><Line w="70%" h={12} /></div>)}</div>
    <Line h={48} /></div>;
}
const Empty = ({ children }: { children?: ReactNode }) => <div className="card empty"><ClipboardList size={36} strokeWidth={1.5} aria-hidden="true" /><h3>No health checks yet</h3><p>Your results will appear here after you complete a health check at a kiosk using your account.</p>{children}</div>;

function RecordRow({ r, i = 0 }: { r: Result; i?: number }) {
  return <motion.li {...rise(i)}><button className="row" onClick={() => go(`/results/${r.id}`)}>
    <div className="body"><div className="t">{fmtDate(r.recorded_at)}</div><div className="d">Health check · {fmtTime(r.recorded_at)}</div><div className="d" style={{ marginBottom: 4 }}>{summaryLine(r)}</div><Status tone={FLAG_TONE[r.flag]} /></div>
    <ChevronRight size={20} className="chev" aria-hidden="true" /></button></motion.li>;
}

export function Dashboard({ me, rows }: { me: Patient; rows: Result[] | null }) {
  const first = me.name.split(/\s+/)[0];
  if (rows === null) return <><Head title={first} eyebrow={greeting()} /><DashSkel /></>;
  const latest = rows[0];
  return <>
    <Head title={first} eyebrow={greeting()} />
    {!latest ? <Empty /> : <>
      <motion.section className="card hero" aria-label="Latest health check" {...rise(0)}>
        <p className="label">Latest health check</p><h2>{fmtDate(latest.recorded_at, true)}</h2>
        <Note tone={FLAG_TONE[latest.flag]}>{FLAG_SUMMARY[latest.flag]}</Note>
        <div className="tiles">{[M.temp, M.bp, M.spo2, M.pulse].map((m) => <div className="tile" key={m.key}><p className="label">{m.label}</p><p className="v num">{m.text(latest)}{m.val(latest) != null && <small>{m.unit}</small>}</p><div className="s"><Status tone={m.tone(latest)} /></div></div>)}</div>
        <button className="btn btn-primary btn-block" onClick={() => go(`/results/${latest.id}`)}>View full results</button>
      </motion.section>
      {rows.length > 1 && <>
        <div className="sec"><h2>Recent</h2><a className="link" href="#/results">See all<ChevronRight size={16} aria-hidden="true" /></a></div>
        <ul className="card list">{rows.slice(1, 4).map((r, i) => <RecordRow key={r.id} r={r} i={i + 2} />)}</ul></>}
    </>}
    <p className="fine">For information only. This isn’t a diagnosis. Talk to clinic staff about any concerns.</p>
  </>;
}

export function Results({ rows }: { rows: Result[] | null }) {
  const [range, setRange] = useState<"all" | "30" | "90">("all");
  const list = useMemo(() => (rows ?? []).filter((r) => range === "all" || Date.parse(r.recorded_at) >= Date.now() - Number(range) * 864e5), [rows, range]);
  return <>
    <Head title="My Results" sub="Every health check, newest first." />
    {rows === null ? <><Skel h={110} /><Skel h={110} /></> : !rows.length ? <Empty /> : <>
      {rows.length > 6 && <div className="seg" role="group" aria-label="Show results from" style={{ marginBottom: 16 }}>{([["all", "All"], ["30", "Last 30 days"], ["90", "Last 90 days"]] as const).map(([v, l]) => <button key={v} aria-pressed={range === v} onClick={() => setRange(v)}>{l}</button>)}</div>}
      {list.length ? <ul className="card list">{list.map((r, i) => <RecordRow key={r.id} r={r} i={i} />)}</ul> : <div className="card empty"><h3>Nothing in this period</h3><p>Try a longer date range.</p></div>}
    </>}
  </>;
}

export function Detail({ row, loading }: { row?: Result; loading: boolean }) {
  const back = <a className="back" href="#/results"><ChevronLeft size={20} aria-hidden="true" />My Results</a>;
  if (loading) return <>{back}<Skel h={90} /><Skel h={220} /></>;
  if (!row) return <>{back}<div className="card empty"><h3>We couldn’t find that result</h3><p>It may have been removed, or it belongs to another account.</p></div></>;
  const group = (title: string, ms: Metric[]) => <><p className="group-t">{title}</p><div className="card list">{ms.map((m) => <div key={m.key} className="kv" style={{ borderTop: "1px solid var(--line)" }}>
    <div className="k"><div>{m.label}</div>{m.usual && m.val(row) != null && <div className="label">Usual: {m.usual}</div>}</div>
    <div className="val"><div className="num">{m.val(row) == null ? "—" : <>{m.text(row)}{m.unit && <small> {m.unit}</small>}</>}</div>{m.val(row) == null ? <Status tone="none" text="Not measured" /> : m.tone(row) !== "none" && <Status tone={m.tone(row)} />}</div></div>)}</div></>;
  return <>
    {back}
    <Head title={fmtDate(row.recorded_at, true)} sub={`Health check · ${fmtTime(row.recorded_at)}`} />
    <Note tone={FLAG_TONE[row.flag]}>{FLAG_SUMMARY[row.flag]}</Note>
    {group("Vital signs", [M.temp, M.bp, M.spo2, M.pulse])}
    {group("Body measurements", [M.height, M.weight, M.bmi])}
    <p className="fine">“Usual range” uses the same limits as the health kiosk. This is general information, not a diagnosis. BMI limits apply to adults.</p>
    <button className="btn btn-quiet btn-block" style={{ marginTop: 20 }} onClick={() => go("/results")}>Back to results</button>
  </>;
}

function Chart({ rows, m }: { rows: Result[]; m: Metric }) {
  const bp = m.key === "bp";
  const pts = rows.slice(0, 12).reverse().filter((r) => m.val(r) != null);
  const all = pts.flatMap((r) => [m.val(r), bp ? r.diastolic : null]).filter((v): v is number => v != null);
  let lo = Math.min(...all), hi = Math.max(...all); const pad = (hi - lo || 1) * 0.25; lo -= pad; hi += pad;
  const W = 340, H = 170, L = 42, R = 14, T = 14, B = 30;
  const t0 = Date.parse(pts[0].recorded_at), t1 = Date.parse(pts[pts.length - 1].recorded_at);
  const x = (r: Result) => L + (t1 === t0 ? 0.5 : (Date.parse(r.recorded_at) - t0) / (t1 - t0)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const line = (f: (r: Result) => number | null) => pts.filter((r) => f(r) != null).map((r, i) => `${i ? "L" : "M"}${x(r).toFixed(1)} ${y(f(r)!).toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return <div className="card chart">
    {bp && <div className="legend"><span>— Top number (systolic)</span><span>- - Bottom number (diastolic)</span></div>}
    <svg key={m.key} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${m.label} over your last ${pts.length} health checks. Latest ${withUnit(m, last)}.`}>
      {[lo, (lo + hi) / 2, hi].map((v, i) => <g key={i}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" /><text x={L - 6} y={y(v) + 4} textAnchor="end">{v.toFixed(m.dec)}</text></g>)}
      {bp && <path d={line((r) => r.diastolic)} fill="none" stroke="var(--text-2)" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" />}
      <motion.path d={line(m.val)} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: EASE }} />
      {pts.map((r, i) => <motion.circle key={r.id} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.05 }} style={{ transformBox: "fill-box", transformOrigin: "center" }} cx={x(r)} cy={y(m.val(r)!)} r={r === last ? 5 : 3.5} fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />)}
      <text x={L} y={H - 8}>{fmtDate(pts[0].recorded_at)}</text><text x={W - R} y={H - 8} textAnchor="end">{fmtDate(last.recorded_at)}</text>
    </svg>
    <p className="label" style={{ padding: "0 8px" }}>Unit: {m.unit || "index"}. Showing up to your last 12 checks.</p>
  </div>;
}

export function History({ rows }: { rows: Result[] | null }) {
  const [mk, setMk] = useState(TREND[0].key);
  const m = TREND.find((t) => t.key === mk) ?? TREND[0];
  const withData = (rows ?? []).filter((r) => m.val(r) != null);
  const months = useMemo(() => { const g = new Map<string, Result[]>(); (rows ?? []).forEach((r) => { const k = new Date(r.recorded_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }); g.set(k, [...(g.get(k) ?? []), r]); }); return [...g]; }, [rows]);
  const delta = (() => { if (withData.length < 2) return ""; const d = m.val(withData[0])! - m.val(withData[1])!; const u = m.unit ? ` ${m.unit}` : ""; const who = m.key === "bp" ? "Top number" : "Latest";
    return Math.abs(d) < 10 ** -(m.dec + 1) ? `${who} is unchanged since your previous check.` : `${who} is ${d > 0 ? "up" : "down"} ${Math.abs(d).toFixed(m.dec)}${u} since your previous check.`; })();
  return <>
    <Head title="Health History" sub="How your measurements change over time." />
    {rows === null ? <><Skel h={44} /><Skel h={230} /></> : !rows.length ? <Empty /> : <>
      <div className="seg" role="group" aria-label="Measurement" style={{ marginBottom: 12 }}>{TREND.map((t) => <button key={t.key} aria-pressed={mk === t.key} onClick={() => setMk(t.key)}>{t.label}</button>)}</div>
      {withData.length >= 3 ? <><Chart rows={withData} m={m} /><p className="label" style={{ margin: "10px 4px 0" }}>{delta}</p></>
        : <div className="card empty" style={{ padding: 32 }}><h3>Trends need a few more checks</h3><p>We’ll draw a chart after at least 3 health checks with {m.label.toLowerCase()} recorded.</p></div>}
      {months.map(([month, rs]) => <section key={month}><p className="group-t" style={{ marginTop: 28 }}>{month}</p><ul className="card list">{rs.map((r) => <RecordRow key={r.id} r={r} />)}</ul></section>)}
    </>}
  </>;
}

export function Profile({ me, onSignOut, onUpdate }: { me: Patient; onSignOut: () => void; onUpdate: (p: Patient) => void }) {
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<"" | "name" | "pw" | "pin">(""); const [val, setVal] = useState("");
  const [currentPassword, setCurrentPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false); const [showNew, setShowNew] = useState(false); const [showConfirm, setShowConfirm] = useState(false);
  const [pin, setPin] = useState(""); const [confirmPin, setConfirmPin] = useState(""); const [showPin, setShowPin] = useState(false);
  const [pinSetAt, setPinSetAt] = useState<string | null | undefined>(undefined);
  useEffect(() => { let live = true; void api.kioskPinStatus().then((d) => { if (live) setPinSetAt(d); }); return () => { live = false; }; }, []);
  const say = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3200); };
  const resetPasswordFields = () => { setPin(""); setConfirmPin(""); setShowPin(false); setCurrentPassword(""); setVal(""); setConfirmPassword(""); setShowCurrent(false); setShowNew(false); setShowConfirm(false); };
  const start = (k: "name" | "pw" | "pin") => { setOpen(k); setVal(k === "name" ? me.name : ""); resetPasswordFields(); };
  const passwordStrong = isStrongPassword(val);
  async function save() {
    setBusy(true);
    try {
      if (open === "name") {
        if (!val.trim()) throw new Error("Please enter your name.");
        await api.updateName(val.trim()); onUpdate({ ...me, name: val.trim().slice(0, 80) }); say("Name updated.");
      } else if (open === "pin") {
        const problem = pinProblem(pin); if (problem) throw new Error(problem);
        if (pin !== confirmPin) throw new Error("Your PINs do not match.");
        await api.setKioskPin(pin); setPinSetAt(new Date().toISOString()); say("Kiosk PIN saved.");
      } else {
        if (!currentPassword) throw new Error("Enter your current password first.");
        if (!passwordStrong) throw new Error("Your new password must have at least 8 characters, an uppercase letter, a lowercase letter, a number, and a special character.");
        if (val === currentPassword) throw new Error("Your new password must be different from your current password.");
        if (val !== confirmPassword) throw new Error("Your new passwords do not match.");
        await api.changePassword(me.email, currentPassword, val); say("Password updated successfully.");
      }
      setOpen(""); setVal(""); resetPasswordFields();
    } catch (e) { say(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(false); }
  }
  const initials = me.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const act = (Icon: typeof KeyRound, t: string, d: string, k: "name" | "pw" | "pin") => <button className="row" onClick={() => start(k)} style={{ borderTop: "1px solid var(--line)" }}><Icon size={20} aria-hidden="true" color="var(--text-2)" /><div className="body"><div className="t" style={{ fontWeight: 500 }}>{t}</div><div className="d">{d}</div></div><ChevronRight size={20} className="chev" aria-hidden="true" /></button>;
  const passwordField = (id: string, label: string, value: string, setValue: (v: string) => void, visible: boolean, toggle: () => void, autoComplete: string, placeholder: string) => <div style={{ marginTop: 12 }}><label className="label" htmlFor={id}>{label}</label><div style={{ position: "relative" }}><input id={id} className="text-input password-with-toggle" style={{ paddingRight: 48 }} type={visible ? "text" : "password"} autoComplete={autoComplete} placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value)} /><button type="button" className="icon-btn" style={{ position: "absolute", right: 2, top: 2 }} onClick={toggle} aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>;
  const pinField = (id: string, label: string, value: string, setValue: (v: string) => void, placeholder: string) => <div style={{ marginTop: 12 }}><label className="label" htmlFor={id}>{label}</label><div style={{ position: "relative" }}><input id={id} className="text-input" style={{ paddingRight: 48, letterSpacing: showPin ? "0.2em" : undefined }} type={showPin ? "text" : "password"} inputMode="numeric" pattern="[0-9]*" maxLength={PIN_LENGTH} autoComplete="off" placeholder={placeholder} value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))} /><button type="button" className="icon-btn" style={{ position: "absolute", right: 2, top: 2 }} onClick={() => setShowPin((v) => !v)} aria-label={showPin ? "Hide PIN" : "Show PIN"}>{showPin ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>;
  return <>
    <a className="back back-m" href="#/"><ChevronLeft size={20} aria-hidden="true" />Dashboard</a>
    <Head title="Profile" />
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}><div className="avatar" aria-hidden="true">{initials}</div><div style={{ minWidth: 0 }}><p style={{ fontSize: 20, fontWeight: 600 }}>{me.name}</p><p className="muted" style={{ overflowWrap: "anywhere" }}>{me.email}</p></div></div>
    <p className="group-t">Account</p>
    <div className="card list">
      <div className="kv"><span>Kiosk User ID</span><span className="val num">{me.kioskUserId ?? "Not linked yet"}</span></div>
      {act(Pencil, "Edit name", me.name, "name")}
      {act(Hash, pinSetAt ? "Change kiosk PIN" : "Set up kiosk PIN", pinSetAt ? "Your PIN is set. Use it with your Kiosk User ID at the kiosk." : `Choose a ${PIN_LENGTH}-digit PIN to sign in at the kiosk`, "pin")}
      {act(KeyRound, "Change password", "Verify your current password before changing it", "pw")}
    </div>
    {open && <form className="card edit" onSubmit={(e) => { e.preventDefault(); void save(); }}>
      {open === "name" ? <><label className="label" htmlFor="edit">Full name</label><input id="edit" className="text-input" type="text" autoComplete="name" value={val} onChange={(e) => setVal(e.target.value)} autoFocus /></> : open === "pin" ? <>
        <h3 style={{ margin: "0 0 4px" }}>{pinSetAt ? "Change kiosk PIN" : "Set up kiosk PIN"}</h3>
        <p className="muted" style={{ margin: 0 }}>At the kiosk you will enter your Kiosk User ID, then this {PIN_LENGTH}-digit PIN. Don’t share it. Avoid repeated or sequential digits.</p>
        {!me.kioskUserId && <p className="fine" style={{ textAlign: "left", margin: 0 }}>You can set your PIN now, but the kiosk only works after clinic staff link your Kiosk User ID.</p>}
        {pinField("kiosk-pin", "New PIN", pin, setPin, "Enter a 6-digit PIN")}
        {pinField("kiosk-pin-confirm", "Confirm PIN", confirmPin, setConfirmPin, "Re-enter your PIN")}
        {pin.length === PIN_LENGTH && pinProblem(pin) && <p className="rule-error">{pinProblem(pin)}</p>}
        {confirmPin && <p className={confirmPin === pin ? "rule-pass" : "rule-error"}>{confirmPin === pin ? "✓ PINs match" : "PINs do not match."}</p>}
      </> : <>
        <h3 style={{ margin: "0 0 4px" }}>Change password</h3>
        <p className="muted" style={{ margin: 0 }}>Enter your current password to verify your identity.</p>
        {passwordField("current-password", "Current password", currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent((v) => !v), "current-password", "Enter current password")}
        {passwordField("new-password", "New password", val, setVal, showNew, () => setShowNew((v) => !v), "new-password", "Create a strong new password")}
        <div className="password-feedback"><div className="password-rules">{PASSWORD_RULES.map(({ label, test }) => <span key={label} className={test(val) ? "rule-pass" : "rule-pending"}><CircleCheck className="password-rule-icon" size={15} strokeWidth={2} aria-hidden="true" />{label}</span>)}</div></div>
        {passwordField("confirm-new-password", "Confirm new password", confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm((v) => !v), "new-password", "Re-enter new password")}
        {confirmPassword && <p className={confirmPassword === val ? "rule-pass" : "rule-error"}>{confirmPassword === val ? "✓ Passwords match" : "Passwords do not match."}</p>}
      </>}
      <div className="actions"><button type="button" className="btn btn-quiet" onClick={() => { setOpen(""); resetPasswordFields(); }}>Cancel</button><button className="btn btn-primary" disabled={busy || (open === "name" ? !val.trim() : open === "pin" ? !!pinProblem(pin) || confirmPin !== pin : !currentPassword || !passwordStrong || !confirmPassword || confirmPassword !== val || val === currentPassword)}>{busy ? "Saving…" : open === "name" ? "Save" : open === "pin" ? "Save PIN" : "Update password"}</button></div>
    </form>}
    <p className="group-t">Support</p>
    <div className="card list">{([[CircleHelp, "Help", "/help"], [ShieldCheck, "Privacy", "/privacy"], [FileText, "Terms and Conditions", "/terms"]] as const).map(([Icon, t, to], i) => <a key={to} className="row" href={`#${to}`} style={i ? { borderTop: "1px solid var(--line)" } : undefined}><Icon size={20} aria-hidden="true" color="var(--text-2)" /><div className="body"><div className="t" style={{ fontWeight: 500 }}>{t}</div></div><ChevronRight size={20} className="chev" aria-hidden="true" /></a>)}</div>
    {!me.kioskUserId && <p className="fine" style={{ textAlign: "left" }}>Ask clinic staff to link your Kiosk User ID so your health checks appear here.</p>}
    <button className="btn btn-quiet btn-block" style={{ marginTop: 28 }} onClick={onSignOut}><LogOut size={18} aria-hidden="true" />Sign out</button>
    <p className="fine">Only you and authorised clinic staff can see your results.</p>
    {msg && <div className="toast" role="status">{msg}</div>}
  </>;
}
