import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, ChevronRight, ClipboardCheck, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "./lib/api";
import { fmtDate, fmtTime } from "./lib/health";
import type { Notice } from "./lib/types";

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

/* ---------- dropdown ---------- */

export function NoticeDropdown({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { loading, notices, unread, markRead } = useNotices();
  if (!open) return null;
  return <div className="notice-layer">
    <button type="button" className="notice-dismiss" aria-label="Close notifications" onClick={onClose} />
    <section id="notification-dropdown" className="notice-popover" role="dialog" aria-modal="false" aria-label="Notifications">
      <header className="notice-popover-head">
        <h2>Notifications</h2>
        <div className="notice-popover-actions">
          {unread > 0 && <button type="button" className="notice-mark-all" onClick={() => markRead(notices.filter((n) => !n.read_at).map((n) => n.id))}>Mark all as read</button>}
          <button type="button" className="notice-close" aria-label="Close notifications" onClick={onClose}><X size={19} aria-hidden="true" /></button>
        </div>
      </header>
      {loading ? <div className="skeleton notice-loading" role="status" aria-label="Loading notifications" />
        : !notices.length ? <div className="notice-empty"><Bell size={30} strokeWidth={1.5} aria-hidden="true" /><p>No notifications yet</p></div>
        : <ul className="notice-list">
          <AnimatePresence initial={false} mode="popLayout">
          {notices.map((notice) => {
            const isNew = !notice.read_at;
            return <motion.li key={notice.id} layout="position" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <article className={`notice-item${isNew ? " unread" : ""}`}>
                <div className="notice-item-copy">
                  <span className="notice-icon" aria-hidden="true"><ClipboardCheck size={18} /></span>
                  <div className="notice-title">
                    <p>Your health check was reviewed by the clinic staff.</p>
                    <time className="notice-time" dateTime={notice.reviewed_at}>{when(notice.reviewed_at)}{isNew && <span className="sr-only"> (unread)</span>}</time>
                  </div>
                  {isNew && <span className="notice-unread-dot" aria-label="Unread" />}
                </div>
                <a className="notice-view" href={`#/results/${notice.result_id}`} onClick={() => { markRead([notice.id]); onClose(); }}>View Full Results<ChevronRight size={17} aria-hidden="true" /></a>
              </article>
            </motion.li>;
          })}
          </AnimatePresence>
        </ul>}
    </section>
  </div>;
}
