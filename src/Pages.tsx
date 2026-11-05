import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export type DocKind = "terms" | "privacy" | "help";
export const INFO_ROUTES = ["/terms", "/privacy", "/help"];
const MAIL: string = import.meta.env.VITE_SUPPORT_EMAIL || "";
const UPDATED = "October 26, 2026";
const Contact = () => MAIL ? <a href={`mailto:${MAIL}`} style={{ color: "var(--link)", textDecoration: "underline", textUnderlineOffset: 3 }}>{MAIL}</a> : <>the school clinic office</>;
const EMERGENCY = "If you think you are having a medical emergency, contact your local emergency services right away. Do not use this app.";

type Sec = { h: string; body: ReactNode };
const TERMS: Sec[] = [
  { h: "1. Agreeing to these terms", body: <p>By creating an account or using the Health Records portal (“the Service”), you agree to these Terms and to our <a href="#/privacy">Privacy Policy</a>. If you do not agree, please do not use the Service.</p> },
  { h: "2. What the Service is", body: <p>The Service lets you view results from health checks taken at the school clinic’s health kiosk, such as temperature, blood pressure, oxygen level, pulse, height, weight and BMI. It is operated by the College for Research and Technology, Cabanatuan.</p> },
  { h: "3. Not medical advice", body: <><p>The Service is for information only. It is not a diagnostic tool and does not give medical advice. “Usual range” labels are general guides and do not replace a conversation with a health professional. Kiosk readings can be affected by how the measurement was taken.</p><p>{EMERGENCY}</p></> },
  { h: "4. Your account", body: <ul><li>Give accurate information and keep your password private.</li><li>Use your own account only. Do not share it or access anyone else’s records.</li><li>Clinic staff link your Kiosk User ID to your account. Your results appear after that link is made.</li><li>Tell us if you think someone else has used your account.</li></ul> },
  { h: "5. Acceptable use", body: <p>Do not try to break, overload or gain unauthorised access to the Service, its data or other users’ accounts, and do not use it for anything unlawful.</p> },
  { h: "6. Availability and changes", body: <p>We try to keep the Service available, but it may be unavailable from time to time, for example during maintenance. We may update the Service or these Terms. When changes are significant, we will tell you in the app. Continuing to use the Service means you accept the updated Terms.</p> },
  { h: "7. Ending your account", body: <p>You may stop using the Service at any time. We may suspend accounts that break these Terms. Ask the clinic if you want your account or data removed.</p> },
  { h: "8. Contact", body: <p>Questions about these Terms? Contact <Contact />.</p> },
];
const PRIVACY: Sec[] = [
  { h: "What we collect", body: <ul><li><b>Account details:</b> your name, email address and how you sign in (email and password, or Google).</li><li><b>Health check data:</b> the date and time, kiosk, your Kiosk User ID, and the measurements taken (temperature, blood pressure, oxygen level, pulse, height, weight, BMI).</li></ul> },
  { h: "How we use it", body: <p>To show you your own results and history, and so authorised clinic staff can review health checks as part of the school clinic’s work. We do not sell your data and we do not use it for advertising.</p> },
  { h: "Who can see it", body: <p>You, and authorised clinic staff. Other patients cannot see your records. Access rules on our database limit each account to its own results.</p> },
  { h: "Services we use", body: <ul><li><b>Supabase</b> stores account and health check data and handles sign-in.</li><li><b>Google</b> is used only if you choose “Continue with Google”. We receive your name and email from Google, never your Google password.</li></ul> },
  { h: "Security", body: <p>Data is sent over encrypted connections and protected by sign-in and access rules. No system is perfectly secure, so please keep your password private and sign out on shared devices.</p> },
  { h: "How long we keep it", body: <p>Health check records are kept for as long as the clinic needs them for its health records. Ask the clinic if you want to know the current retention period.</p> },
  { h: "Your rights", body: <p>You can ask to see, correct or object to the use of your personal data, and to ask for it to be deleted where the law allows. You can edit your name in Profile at any time. For anything else, contact <Contact />. If you are in the Philippines, you also have rights under the Data Privacy Act of 2012 (Republic Act 10173).</p> },
  { h: "Children and guardians", body: <p>If you are under 18, a parent or guardian may need to help you with your account, as the school’s policies require.</p> },
  { h: "Changes and contact", body: <p>We will update this page if our practices change. Questions? Contact <Contact />.</p> },
];
const FAQ: [string, ReactNode][] = [
  ["I can’t see my results", <p>Your account has to be linked to your Kiosk User ID by clinic staff. Ask the clinic to link it (your Kiosk User ID is shown in Profile once it is). After that, new health checks taken with your ID appear here.</p>],
  ["How do I sign in at the kiosk?", <p>Set up a 6-digit kiosk PIN under Profile, then Set up kiosk PIN. At the kiosk, choose the account option, enter your Kiosk User ID, then your PIN. After five wrong PINs the kiosk locks you out for 15 minutes. If you forget your PIN, set a new one here.</p>],
  ["What does “Outside usual range” mean?", <p>It means a measurement was above or below the limits the kiosk uses as a general guide. It is not a diagnosis. If you are worried, talk to clinic staff. “Not rated” means there is no usual range for that measurement.</p>],
  ["I forgot my password", <p>On the sign-in page, enter your email and tap “Forgot password?” We will send you a six-digit password reset code. If you signed up with Google, just use “Continue with Google”.</p>],
  ["How do I change my name or password?", <p>Open Profile, then choose “Edit name” or “Change password”.</p>],
  ["Who can see my results?", <p>Only you and authorised clinic staff. See the <a href="#/privacy">Privacy Policy</a> for details.</p>],
  ["How do I install the Android app?", <p>On the home page, tap “Download APK” and open the file. Your phone may ask you to allow installs from your browser. You can also use the website without installing anything.</p>],
];

const META = { terms: ["Terms and Conditions", `Last updated ${UPDATED}`], privacy: ["Privacy Policy", `Last updated ${UPDATED}`], help: ["Help", "Answers to common questions."] } as const;

export function Doc({ kind, back, hideBackOnDesktop = false }: { kind: DocKind; back: { to: string; label: string }; hideBackOnDesktop?: boolean }) {
  const [title, sub] = META[kind];
  return <article className="doc">
    <a className={hideBackOnDesktop ? "back back-m" : "back"} href={`#${back.to}`}><ChevronLeft size={20} aria-hidden="true" />{back.label}</a>
    <div className="head"><h1>{title}</h1><p>{sub}</p></div>
    {kind === "help" ? <>
      <div className="card list">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><div>{a}</div></details>)}</div>
      <h2>Still need help?</h2><p>Visit the clinic or contact <Contact />.</p><p className="note bad" style={{ marginTop: 16 }}>{EMERGENCY}</p>
      <p className="fine"><a href="#/terms">Terms</a> · <a href="#/privacy">Privacy</a></p>
    </> : (kind === "terms" ? TERMS : PRIVACY).map((s) => <section key={s.h}><h2>{s.h}</h2>{s.body}</section>)}
  </article>;
}
