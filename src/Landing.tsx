import type { ReactNode } from "react";
import { motion } from "motion/react";
import { CircleCheck, Heart, LineChart, ShieldCheck, Zap } from "lucide-react";
import { BRAND } from "./lib/brand";
import { Blobs, EASE, Ecg } from "./Backdrop";

const FEATURES = [
  { Icon: Zap, t: "Results at a glance", d: "Your latest temperature, blood pressure, oxygen level and pulse, right after your kiosk health check." },
  { Icon: LineChart, t: "See your history", d: "Every past check in one place, with simple charts that show how your numbers change." },
  { Icon: ShieldCheck, t: "Private by design", d: "Only you and authorised clinic staff can see your records." },
];

const Reveal = ({ children, i = 0, className }: { children: ReactNode; i?: number; className?: string }) =>
  <motion.div className={className} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: i * 0.1, ease: EASE }}>{children}</motion.div>;
const drift = (d: number, dur: number) => ({ animate: { y: [0, d, 0] }, transition: { duration: dur, repeat: Infinity, ease: "easeInOut" as const } });

export function Landing() {
  return (
    <div className="land"><Blobs /><div className="dots" aria-hidden="true" />
      <div className="land-in">
        <motion.header className="land-nav" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <div className="brand"><img className="seal" src={BRAND.logo} alt="" /><span className="wordmark">KioskVitalCare</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><a className="link" href="#/signin">Sign in</a></div>
        </motion.header>
        <section className="hero-l">
          <div>
            <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }}>Your health checks, always with you.</motion.h1>
            <motion.p className="lead" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1, ease: EASE }}>View your latest results and complete health history from your phone or computer. Simple, private, and easy to read.</motion.p>
            <motion.div className="cta" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: EASE }}>
              <motion.a className="btn btn-primary" href="#/signup" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Create account</motion.a>
              <motion.a className="btn btn-quiet" href="#/signin" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Sign in</motion.a>
            </motion.div>
          </div>
          <motion.div className="hero-visual" aria-hidden="true" initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25, ease: EASE }}>
            <motion.div className="card peek" {...drift(-8, 7)}>
              <p className="label">Latest health check</p><p className="v num">36.7 °C</p>
              <p className="note ok" style={{ margin: "12px 0 0" }}><CircleCheck size={18} /><span>Everything we measured was in the usual range.</span></p>
              <Ecg className="peek-ecg" />
              <p className="label">Blood pressure 118/76 · Oxygen 98%</p>
            </motion.div>
            <motion.div className="chip chip-a" {...drift(10, 6)}><motion.span style={{ display: "inline-flex" }} animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.9, repeat: Infinity }}><Heart size={16} fill="var(--accent)" stroke="var(--accent)" /></motion.span>Pulse 72 bpm</motion.div>
            <motion.div className="chip chip-b" {...drift(-10, 8)}><CircleCheck size={16} color="var(--ok)" />Oxygen 98%</motion.div>
          </motion.div>
        </section>
        <section className="feats" aria-label="Features">{FEATURES.map(({ Icon, t, d }, i) => <Reveal key={t} i={i}><motion.div className="card feat" whileHover={{ y: -4 }} transition={{ duration: 0.25 }}><Icon size={26} aria-hidden="true" /><h3>{t}</h3><p>{d}</p></motion.div></Reveal>)}</section>
        <p className="land-foot"><a href="#/terms">Terms</a> · <a href="#/privacy">Privacy</a> · <a href="#/help">Help</a></p>
        <p className="land-foot" style={{ marginTop: 8 }}>For information only. Not a diagnosis. Talk to clinic staff about any concerns.</p>
      </div>
    </div>
  );
}
