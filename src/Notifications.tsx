import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, ChevronRight, CircleAlert, CircleCheck, ClipboardCheck, Minus, TriangleAlert } from "lucide-react";
import { api } from "./lib/api";
import { FLAG_TONE, TONE_LABEL, fmtDate, fmtTime, summaryLine, type Tone } from "./lib/health";
import type { Notice, Result } from "./lib/types";

/* ---------- state ---------- */

interface NoticeState {
  /** true until the first load finishes */
  loading: boolean;
  notices: Notice[];
  /** result id -> its notification (one per result) */
  byResult: Map<string, Notice>;
  unread: number;
  markRead: (ids: string[]) => void;
}
const NoticeCtx = createContext<NoticeState>({ loading: true, notices: [], byResult: new Map(), unread: 0, markRead: () => {} });
export const useNotices = () => useContext(NoticeCtx);

/** Loads the signed-in patient's notifications, keeps them live (Realtime) and refreshes when the tab becomes visible again. */
export function NoticeProvider({ patientId, children }: { patientId: string; children: ReactNode }) {
  const [list, setList] = useState<Notice[] | null>(null);
  const reload = useCallback(async () => {
    try { setList(await api.myNotices()); } catch { setList((l) => l ?? []); } // notifications are non-critical: never block the portal
  }, []);

  useEffect(() => {
    void reload();
    const stop = api.watchNotices(patientId, () => void reload());
    const onVisible = () => { if (document.visibilityState === "visible") void reload(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisible); };
  }, [patientId, reload]);

  const markRead = useCallback((ids: string[]) => {
    const now = new Date().toISOString();
    setList((l) => l && l.map((n) => (ids.includes(n.id) && !n.read_at ? { ...n, read_at: now } : n)));
    void api.markNoticesRead(ids).catch(() => void reload());
  }, [reload]);

  const value = useMemo<NoticeState>(() => {
    const notices = list ?? [];
    return { loading: list === null, notices, byResult: new Map(notices.map((n) => [n.result_id, n])), unread: notices.filter((n) => !n.read_at).length, markRead };
  }, [list, markRead]);

  return <NoticeCtx.Provider value={value}>{children}</NoticeCtx.Provider>;
}

/** Renders nothing. Opening a result marks its review notification as read. */
export function MarkViewed({ resultId }: { resultId: string | null }) {
  const { byResult, markRead } = useNotices();
  const n = resultId ? byResult.get(resultId) : undefined;
  useEffect(() => { if (n && !n.read_at) markRead([n.id]); }, [n, markRead]);
  return null;
}

/* ---------- small pieces ---------- */

const go = (to: string) => { window.location.hash = to; };
const TONE_ICON = { ok: CircleCheck, warn: CircleAlert, bad: TriangleAlert, none: Minus };
const Tag = ({ tone }: { tone: Tone }) => { const I = TONE_ICON[tone]; return <span className={`st ${tone}`}><I size={15} aria-hidden="true" />{TONE_LABEL[tone]}</span>; };
const when = (iso: string) => `${fmtDate(iso)} · ${fmtTime(iso)}`;

/** Unread count shown on the bell and the Notifications menu items. */
export const Badge = ({ n }: { n: number }) => (n > 0 ? <span className="badge" aria-hidden="true">{n > 9 ? "9+" : n}</span> : null);
export const unreadLabel = (n: number) => (n > 0 ? `Notifications, ${n} unread` : "Notifications");

/** Shown on a result's detail page when staff have reviewed it. */
export function ReviewCard({ notice }: { notice?: Notice }) {
  if (!notice) return null;
  return (
    <section className="card review" aria-label="Staff review">
      <p className="review-h"><ClipboardCheck size={18} aria-hidden="true" />Reviewed by clinic staff<span>{fmtDate(notice.reviewed_at)}</span></p>
      {notice.staff_note ? <p className="review-note">{notice.staff_note}</p> : <p className="label">Your results were reviewed. No additional note was added.</p>}
    </section>
  );
}

/** Dashboard banner for reviews the patient hasn't opened yet. */
export function NewReviewBanner({ rows }: { rows: Result[] }) {
  const { notices } = useNotices();
  const fresh = notices.filter((n) => !n.read_at);
  if (!fresh.length) return null;
  const one = fresh.length === 1 ? fresh[0] : null;
  const r = one ? rows.find((x) => x.id === one.result_id) : undefined;
  return (
    <button type="button" className="review-banner" onClick={() => go(one ? `/results/${one.result_id}` : "/notifications")}>
      <span className="rb-icon"><Bell size={20} aria-hidden="true" /></span>
      <span className="rb-body">
        <strong>{one ? "Clinic staff reviewed your health check" : `${fresh.length} new reviews from clinic staff`}</strong>
        <small>{one ? `${fmtDate(r ? r.recorded_at : one.reviewed_at)}${one.staff_note ? " · includes a note" : ""}` : "Tap to see them"}</small>
      </span>
      <ChevronRight size={20} className="chev" aria-hidden="true" />
    </button>
  );
}

/* ---------- page ---------- */

export function Notifications({ rows }: { rows: Result[] | null }) {
  const { loading, notices, unread, markRead } = useNotices();
  const byId = useMemo(() => new Map((rows ?? []).map((r) => [r.id, r])), [rows]);
  return <>
    <header className="notice-page-head">
      <div>
        <p className="notice-kicker">UPDATES</p>
        <h1>Notifications</h1>
        <p>Updates from clinic staff about your health checks.</p>
      </div>
      {!loading && notices.length > 0 && <span className={`notice-count${unread ? " has-unread" : ""}`}>{unread ? `${unread} unread` : "All caught up"}</span>}
    </header>
    {loading ? <div className="skeleton" style={{ height: 150 }} role="status" aria-label="Loading notifications" />
      : !notices.length ? <div className="card empty"><Bell size={36} strokeWidth={1.5} aria-hidden="true" /><h3>No notifications yet</h3><p>When clinic staff review one of your health checks, you’ll see it here together with their note.</p></div>
      : <>
        {unread > 0 && <div className="notice-tools"><span className="label" aria-live="polite">Your latest updates</span><button type="button" className="notice-mark-all" onClick={() => markRead(notices.filter((n) => !n.read_at).map((n) => n.id))}><CircleCheck size={16} aria-hidden="true" />Mark all as read</button></div>}
        <ul className="notice-list">
          {notices.map((n) => {
            const r = byId.get(n.result_id), isNew = !n.read_at;
            return <li key={n.id}><article className={isNew ? "card notice unread" : "card notice"}>
              <header className="notice-h">
                <span className="notice-icon" aria-hidden="true"><ClipboardCheck size={19} /></span>
                <div className="notice-title"><h3>Your health check was reviewed</h3><p className="label">{when(n.reviewed_at)}{isNew && <span className="sr-only"> (unread)</span>}</p></div>
                <span className={`notice-state${isNew ? " is-new" : ""}`}>{isNew ? "New" : "Read"}</span>
              </header>
              {r && <div className="notice-result"><p className="notice-result-label">Health check</p><div className="t">{fmtDate(r.recorded_at)} · {fmtTime(r.recorded_at)}</div><div className="d">{summaryLine(r)}</div><Tag tone={FLAG_TONE[r.flag]} /></div>}
              {n.staff_note ? <div className="notice-note"><p className="label">Note from clinic staff</p><p className="review-note">{n.staff_note}</p></div> : <p className="notice-no-note">Reviewed by clinic staff. No note was added.</p>}
              <div className="notice-actions">
                <button type="button" className="notice-view" onClick={() => go(`/results/${n.result_id}`)}>View full results<ChevronRight size={17} aria-hidden="true" /></button>
                {isNew && <button type="button" className="notice-mark-read" onClick={() => markRead([n.id])}>Mark as read</button>}
              </div>
            </article></li>;
          })}
        </ul>
      </>}
    <p className="fine">For information only. This isn’t a diagnosis. Talk to clinic staff about any concerns.</p>
  </>;
}
