import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { events } = await req.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Batch insert up to 50 events
    const rows = events.slice(0, 50).map((e: any) => ({
      session_id: e.session_id,
      event_type: e.event_type,
      page: e.page || '/',
      element_tag: e.element_tag || null,
      element_text: (e.element_text || '').slice(0, 100) || null,
      element_id: e.element_id || null,
      element_class: (e.element_class || '').slice(0, 200) || null,
      x_position: e.x_position ?? null,
      y_position: e.y_position ?? null,
      viewport_width: e.viewport_width ?? null,
      viewport_height: e.viewport_height ?? null,
      scroll_depth: e.scroll_depth ?? null,
    }));

    const { error } = await supabaseAdmin.from('analytics_events').insert(rows);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
