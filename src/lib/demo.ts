// MOCK DATA ONLY. Used when Supabase keys are missing. Never mixed with real records (see api.ts).
import type { Flag, Patient, Result } from "./types";
export const demoPatient: Patient = { id: "demo", email: "maria.santos@example.com", name: "Maria Santos", kioskUserId: "2458" };
export function demoResults(): Result[] {
  const days = [3, 21, 48, 77, 104, 139, 171];
  return days.map((d, i): Result => {
    const temperature = [36.7, 36.9, 37.5, 36.6, 36.8, 36.7, 36.9][i], systolic = [118, 122, 128, 134, 120, 116, 119][i], diastolic = [76, 78, 82, 88, 79, 74, 77][i];
    const spo2 = [98, 97, 96, 94, 98, 99, 98][i], weight_kg = [58.4, 58.9, 59.2, 59.8, 59.1, 58.7, 58.5][i], height_cm = 160;
    const warn = temperature >= 37.3 || systolic >= 130 || diastolic >= 85 || spo2 < 95;
    const flag: Flag = warn ? "review" : "normal";
    return { id: `demo-${i}`, recorded_at: new Date(Date.now() - d * 864e5 - 36e5 * (9 + i)).toISOString(), kiosk_id: "KIOSK-001", temperature, systolic, diastolic, spo2,
      heart_rate: [72, 68, 80, 76, 70, 66, 71][i], height_cm, weight_kg, bmi: Number((weight_kg / 1.6 ** 2).toFixed(1)), flag };
  });
}
