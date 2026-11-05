import type { Flag, Result } from "./types";
export type Tone = "ok" | "warn" | "bad" | "none";

/** Same thresholds as the kiosk and staff portal, so the three never disagree. Plain-language labels; not a diagnosis. */
export const TONE_LABEL: Record<Tone, string> = { ok: "In usual range", warn: "Outside usual range", bad: "Well outside usual range", none: "Not rated" };
export const FLAG_SUMMARY: Record<Flag, string> = {
  normal: "Everything we measured was in the usual range.",
  review: "Some measurements were outside the usual range.",
  urgent: "Some measurements were well outside the usual range. Please speak with clinic staff.",
};
export const FLAG_TONE: Record<Flag, Tone> = { normal: "ok", review: "warn", urgent: "bad" };

export interface Metric { key: string; label: string; unit: string; usual?: string; dec: number; val: (r: Result) => number | null; text: (r: Result) => string; tone: (r: Result) => Tone }
const n = (v: number | null, d: number) => (v == null ? "—" : v.toFixed(d));
const t3 = (v: number | null, warn: number, bad: number, low = false): Tone => v == null ? "none" : low ? (v < bad ? "bad" : v < warn ? "warn" : "ok") : v >= bad ? "bad" : v >= warn ? "warn" : "ok";

export const M: Record<"temp" | "bp" | "spo2" | "pulse" | "height" | "weight" | "bmi", Metric> = {
  temp: { key: "temp", label: "Temperature", unit: "°C", usual: "Below 37.3 °C", dec: 1, val: (r) => r.temperature, text: (r) => n(r.temperature, 1), tone: (r) => t3(r.temperature, 37.3, 38.3) },
  bp: { key: "bp", label: "Blood pressure", unit: "mmHg", usual: "Below 130/85", dec: 0, val: (r) => r.systolic, text: (r) => (r.systolic == null ? "—" : `${Math.round(r.systolic)}/${Math.round(r.diastolic ?? 0)}`),
    tone: (r) => r.systolic == null ? "none" : r.systolic >= 150 || (r.diastolic ?? 0) >= 95 ? "bad" : r.systolic >= 130 || (r.diastolic ?? 0) >= 85 ? "warn" : "ok" },
  spo2: { key: "spo2", label: "Oxygen level", unit: "%", usual: "95% or higher", dec: 0, val: (r) => r.spo2, text: (r) => n(r.spo2, 0), tone: (r) => t3(r.spo2, 95, 90, true) },
  pulse: { key: "pulse", label: "Pulse", unit: "bpm", dec: 0, val: (r) => r.heart_rate, text: (r) => n(r.heart_rate, 0), tone: () => "none" },
  height: { key: "height", label: "Height", unit: "cm", dec: 0, val: (r) => r.height_cm, text: (r) => n(r.height_cm, 0), tone: () => "none" },
  weight: { key: "weight", label: "Weight", unit: "kg", dec: 1, val: (r) => r.weight_kg, text: (r) => n(r.weight_kg, 1), tone: () => "none" },
  bmi: { key: "bmi", label: "BMI", unit: "", usual: "18.5 – 24.9 (adults)", dec: 1, val: (r) => r.bmi, text: (r) => n(r.bmi, 1), tone: (r) => r.bmi == null ? "none" : r.bmi >= 30 ? "bad" : r.bmi >= 25 || r.bmi < 18.5 ? "warn" : "ok" },
};
export const TREND = [M.temp, M.bp, M.spo2, M.pulse, M.weight];
export const withUnit = (m: Metric, r: Result) => (m.val(r) == null ? "—" : `${m.text(r)}${m.unit ? (m.unit === "%" ? "" : " ") + m.unit : ""}`);

export const fmtDate = (iso: string, long = false) => new Date(iso).toLocaleDateString(undefined, long ? { weekday: "long", day: "numeric", month: "long", year: "numeric" } : { day: "numeric", month: "short", year: "numeric" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
export const summaryLine = (r: Result) => [M.temp, M.bp, M.spo2].filter((m) => m.val(r) != null).map((m) => `${({ temp: "Temp", bp: "BP", spo2: "Oxygen" } as Record<string, string>)[m.key]} ${withUnit(m, r)}`).join(" · ") || "No vital signs recorded";
