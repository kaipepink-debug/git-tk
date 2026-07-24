import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "tracker_session_id";

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

interface AnalyticsEvent {
  session_id: string;
  event_type: string;
  page: string;
  element_tag?: string;
  element_text?: string;
  element_id?: string;
  element_class?: string;
  x_position?: number;
  y_position?: number;
  viewport_width?: number;
  viewport_height?: number;
  scroll_depth?: number;
}

export function useAnalyticsTracker(page: string) {
  const buffer = useRef<AnalyticsEvent[]>([]);
  const maxScrollDepth = useRef(0);
  const scrollMilestones = useRef(new Set<number>());
  const flushTimer = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const sessionId = getSessionId();

    const flush = () => {
      if (buffer.current.length === 0) return;
      const events = [...buffer.current];
      buffer.current = [];
      supabase.functions.invoke("track-event", { body: { events } });
    };

    // Flush every 5 seconds
    flushTimer.current = setInterval(flush, 5000);

    // Track clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find the most meaningful element (button, link, etc.)
      const meaningful = target.closest("button, a, [role='button'], input[type='submit'], [data-track]") || target;

      buffer.current.push({
        session_id: sessionId,
        event_type: "click",
        page,
        element_tag: meaningful.tagName,
        element_text: (meaningful.textContent || "").trim().slice(0, 100),
        element_id: meaningful.id || undefined,
        element_class: meaningful.className ? String(meaningful.className).slice(0, 200) : undefined,
        x_position: Math.round(e.pageX),
        y_position: Math.round(e.pageY),
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
      });
    };

    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const depth = Math.min(100, Math.round((scrollTop / docHeight) * 100));
      if (depth > maxScrollDepth.current) {
        maxScrollDepth.current = depth;
      }

      // Record milestones: 25, 50, 75, 100
      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (depth >= m && !scrollMilestones.current.has(m)) {
          scrollMilestones.current.add(m);
          buffer.current.push({
            session_id: sessionId,
            event_type: "scroll",
            page,
            scroll_depth: m,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
          });
        }
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("scroll", handleScroll);
      clearInterval(flushTimer.current);
      flush(); // flush remaining
    };
  }, [page]);
}
