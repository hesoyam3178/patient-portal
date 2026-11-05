/** Kiosk PIN rules. Keep in sync with set_kiosk_pin() in cloud/supabase/migration_006_kiosk_pin.sql. */
export const PIN_LENGTH = 6;

/** Returns an error message, or "" when the PIN is acceptable. */
export function pinProblem(pin: string): string {
  if (!new RegExp(`^[0-9]{${PIN_LENGTH}}$`).test(pin)) return `Your PIN must be exactly ${PIN_LENGTH} digits.`;
  if (/^(\d)\1+$/.test(pin) || "01234567890123456789".includes(pin) || "98765432109876543210".includes(pin))
    return "That PIN is too easy to guess. Avoid repeated or sequential digits.";
  return "";
}
