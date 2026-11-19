import { CircleAlert, CircleCheck, Minus, TriangleAlert } from "lucide-react";
import { TONE_LABEL, type Tone } from "./lib/health";

export const TONE_ICON = { ok: CircleCheck, warn: CircleAlert, bad: TriangleAlert, none: Minus };

export function StatusTag({ tone, text }: { tone: Tone; text?: string }) {
  const Icon = TONE_ICON[tone];
  return <span className={`st ${tone}`}><Icon size={15} aria-hidden="true" />{text ?? TONE_LABEL[tone]}</span>;
}
