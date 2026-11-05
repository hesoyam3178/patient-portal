import { motion } from "motion/react";

/** Soft, slowly drifting colour shapes. Decorative only. `art` = for use on the teal brand panel. */
export function Blobs({ art = false }: { art?: boolean }) {
  const shapes = [
    { k: "a", s: 460, x: "-12%", y: "-14%", dx: 50, dy: 34, d: 17 },
    { k: "b", s: 380, x: "58%", y: "4%", dx: -36, dy: 44, d: 21 },
    { k: "c", s: 340, x: "26%", y: "62%", dx: 34, dy: -34, d: 24 },
  ];
  return (
    <div className={`blobs${art ? " art" : ""}`} aria-hidden="true">
      {shapes.map((o) => <motion.span key={o.k} className={`blob blob-${o.k}`} style={{ width: o.s, height: o.s, left: o.x, top: o.y }}
        animate={{ x: [0, o.dx, 0], y: [0, o.dy, 0], scale: [1, 1.12, 1] }} transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }} />)}
    </div>
  );
}

/** A heartbeat line that draws itself, fades, and repeats. */
export function Ecg({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 80" preserveAspectRatio="none" aria-hidden="true">
      <motion.path d="M0 40 H108 L124 40 L140 10 L158 70 L174 40 H228 L240 33 L254 40 H400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: [0, 1, 1], opacity: [0, 1, 0] }} transition={{ duration: 4.2, times: [0, 0.6, 1], repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }} />
    </svg>
  );
}

export const EASE = [0.25, 0.1, 0.25, 1] as const;
