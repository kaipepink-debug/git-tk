import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { session_id, page, user_agent, action } = await req.json();

    if (action === 'leave') {
      await supabaseAdmin.from('active_sessions').delete().eq('session_id', session_id);
      // Also cleanup stale sessions
      await supabaseAdmin.rpc('cleanup_stale_sessions');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Upsert session
    const { error } = await supabaseAdmin
      .from('active_sessions')
      .upsert(
        { session_id, page, user_agent, last_seen_at: new Date().toISOString() },
        { onConflict: 'session_id' }
      );

    if (error) throw error;

    // Cleanup stale sessions
    await supabaseAdmin.rpc('cleanup_stale_sessions');

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
