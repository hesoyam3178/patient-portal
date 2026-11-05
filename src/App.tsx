import { useCallback, useEffect, useState } from "react";
import { ClipboardList, House, TrendingUp, CircleHelp, ShieldCheck, FileText, UserRound, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { api, isDemo } from "./lib/api";
import { BRAND } from "./lib/brand";
import type { Patient, Result } from "./lib/types";
import { Auth, Welcome } from "./Auth";
import { Landing } from "./Landing";
import { Blobs } from "./Backdrop";
import { Doc, INFO_ROUTES, type DocKind } from "./Pages";
import { Dashboard, Detail, History, Profile, Results, Banner } from "./screens";

const TABS = [{ to: "/", label: "Dashboard", Icon: House }, { to: "/results", label: "My Results", Icon: ClipboardList }, { to: "/history", label: "Health History", Icon: TrendingUp }];
const MENU = [...TABS, { to: "/profile", label: "Profile", Icon: UserRound }];
const BrandLink = ({ label }: { label?: string }) => <a className="brand" href="#/" aria-label={label}><img className="seal" src={BRAND.logo} alt="" /><span className="wordmark">KioskVitalCare</span></a>;

/** Phone-only top bar with a dropdown menu. Closes on navigation, Escape, outside tap and when resized to desktop. */
function TopBar({ path, tab }: { path: string; tab: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onResize = () => { if (window.innerWidth >= 900) setOpen(false); };
    window.addEventListener("keydown", onKey); window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("resize", onResize); };
  }, [open]);
  return (
    <>
      <header className="topbar">
        <BrandLink label="KioskVitalCare home" />
        <button type="button" className="menu-btn" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>{open ? <X size={26} aria-hidden="true" /> : <Menu size={26} aria-hidden="true" />}</button>
        <AnimatePresence>
          {open && (
            <motion.nav key="dd" id="mobile-menu" className="dropdown" aria-label="Main navigation" style={{ transformOrigin: "top right" }}
              initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }} transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}>
              {MENU.map(({ to, label, Icon }) => (
                <a key={to} href={`#${to}`} className="dd-item" aria-current={tab === to ? "page" : undefined}><Icon size={21} strokeWidth={tab === to ? 2.2 : 1.8} aria-hidden="true" />{label}</a>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}
    </>
  );
}

/** Desktop-only sidebar. */
function Sidebar({ me, tab }: { me: Patient; tab: string }) {
  return (
    <aside className="side" aria-label="Sidebar navigation">
      <BrandLink label="KioskVitalCare home" />
      <nav className="side-main-nav" aria-label="Main navigation">
        {TABS.map(({ to, label, Icon }) => (
          <a key={to} href={`#${to}`} className="tab sd" aria-current={tab === to ? "page" : undefined}><Icon size={22} strokeWidth={tab === to ? 2.2 : 1.8} aria-hidden="true" />{label}</a>
        ))}
      </nav>
      <div className="side-bottom">
        <nav className="side-utility-nav" aria-label="Help and policies">
          <a className="side-utility-link" href="#/help"><CircleHelp size={19} aria-hidden="true" /><span>Help</span></a>
          <a className="side-utility-link" href="#/privacy"><ShieldCheck size={19} aria-hidden="true" /><span>Privacy</span></a>
          <a className="side-utility-link" href="#/terms"><FileText size={19} aria-hidden="true" /><span>Terms and Conditions</span></a>
        </nav>
        <a className="side-profile" href="#/profile" aria-current={tab === "/profile" ? "page" : undefined}>
          <span className="side-avatar" aria-hidden="true">{(me.name.trim().charAt(0) || "U").toUpperCase()}</span>
          <span className="side-profile-copy"><strong>{me.name || "My profile"}</strong><small>View profile</small></span>
        </a>
      </div>
    </aside>
  );
}

const useRoute = () => {
  const get = () => window.location.hash.replace(/^#/, "") || "/";
  const [path, setPath] = useState(get);
  useEffect(() => { const f = () => { setPath(get()); window.scrollTo(0, 0); }; window.addEventListener("hashchange", f); return () => window.removeEventListener("hashchange", f); }, []);
  return path;
};

export default function App() {
  const [me, setMe] = useState<Patient | null>(null);
  const [booting, setBooting] = useState(true);
  const [rows, setRows] = useState<Result[] | null>(null);
  const [error, setError] = useState("");
  const path = useRoute();

  useEffect(() => { void api.restore().then(setMe).finally(() => setBooting(false)); }, []);
  const load = useCallback(async () => { setError(""); setRows(null); try { setRows(await api.myResults()); } catch (e) { setError(e instanceof Error ? e.message : "Couldn’t load your results."); setRows([]); } }, []);
  useEffect(() => { if (me) void load(); }, [me, load]);

  if (booting) return null;
  const section = "/" + path.split("/")[1];
  const isInfo = INFO_ROUTES.includes(section);
  if (!me && isInfo) return (
    <div className="land"><div className="land-in">
      <header className="land-nav"><BrandLink /><a className="link" href="#/signin">Sign in</a></header>
      <div className="wrap" style={{ paddingBottom: 48 }}><Doc kind={section.slice(1) as DocKind} back={{ to: "/", label: "Home" }} /></div>
    </div></div>);
  if (!me) return path === "/signin" || path === "/signup" ? <Auth mode={path === "/signup" ? "signup" : "signin"} onSuccess={setMe} /> : <Landing />;
  if (me.needsName) return <Welcome me={me} onDone={setMe} />;
  if (path === "/signin" || path === "/signup") { window.location.hash = "/"; return null; }
  const signOut = () => { void api.signOut(); setMe(null); setRows(null); window.location.hash = "/"; };
  const id = path.startsWith("/results/") ? path.slice(9) : null;
  const tab = isInfo ? "/profile" : section;
  const noBar = isInfo || section === "/profile";

  return (
    <>
      <div className="app-bg" aria-hidden="true"><Blobs /><div className="dots" /></div>
      {!noBar && <TopBar path={path} tab={tab} />}
      <Sidebar me={me} tab={tab} />
      <main className={noBar ? "main no-bar" : "main"} key={path}><div className="wrap">
        {isDemo && <Banner>Sample data only. Add your Supabase keys to .env.local to show real results.</Banner>}
        {error && <div className="banner err" role="alert">{error}<span style={{ flex: 1 }} /><button className="link" onClick={() => void load()}>Retry</button></div>}
        {section === "/" && <Dashboard me={me} rows={rows} />}
        {section === "/results" && (id ? <Detail row={rows?.find((r) => r.id === id)} loading={rows === null} /> : <Results rows={rows} />)}
        {section === "/history" && <History rows={rows} />}
        {isInfo && <Doc kind={section.slice(1) as DocKind} back={{ to: "/profile", label: "Profile" }} hideBackOnDesktop />}
        {section === "/profile" && <Profile me={me} onSignOut={signOut} onUpdate={setMe} />}
      </div></main>
    </>
  );
}
