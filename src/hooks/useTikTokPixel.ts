import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTikTokPixel() {
  const loaded = useRef(false);
  const [pixelId, setPixelId] = useState<string | null>(null);

  // Fetch pixel ID from database
  useEffect(() => {
    const fetchPixelId = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "tiktok_pixel_id")
        .single();
      if (data?.value) setPixelId(data.value);
    };
    fetchPixelId();
  }, []);

  // Load pixel script when ID is available
  useEffect(() => {
    if (loaded.current || !pixelId) return;
    loaded.current = true;

    const script = document.createElement("script");
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var i=document.createElement("script");i.type="text/javascript",i.async=!0,i.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(i,a)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }, [pixelId]);
}

export function trackTikTokEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && (window as any).ttq) {
    (window as any).ttq.track(eventName, params);
  }
}
