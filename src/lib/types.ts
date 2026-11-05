export type Flag = "normal" | "review" | "urgent";
/** One row of the `my_results` view: the patient's own kiosk sessions, without staff-only fields. */
export interface Result {
  id: string; recorded_at: string; kiosk_id: string;
  temperature: number | null; systolic: number | null; diastolic: number | null;
  heart_rate: number | null; spo2: number | null;
  height_cm: number | null; weight_kg: number | null; bmi: number | null; flag: Flag;
}
export interface Patient { id: string; email: string; name: string; kioskUserId: string | null; /** true for a first-time Google sign-in that hasn't confirmed a display name yet */ needsName?: boolean }
