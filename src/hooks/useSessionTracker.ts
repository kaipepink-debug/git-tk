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

export function useSessionTracker(page: string) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;

    const track = () => {
      supabase.functions.invoke("track-session", {
        body: { session_id: sessionId, page, user_agent: userAgent, action: "heartbeat" },
      });
    };

    track();
    intervalRef.current = setInterval(track, 15000); // every 15s

    const handleUnload = () => {
      // Use sendBeacon for reliability
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-session`;
      navigator.sendBeacon(
        url,
        JSON.stringify({ session_id: sessionId, action: "leave" })
      );
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleUnload);
      // Also track leave on unmount
      supabase.functions.invoke("track-session", {
        body: { session_id: sessionId, action: "leave" },
      });
    };
  }, [page]);
}
