/**
 * @file supabase/functions/track-event/index.ts
 * @description Função para registrar eventos de analytics disparados pelo front-end.
 * 
 * Captura interações como cliques, scroll e visualizações de página, salvando-as de forma massiva
 * para análise posterior de comportamento do usuário.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Cabeçalhos CORS.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Handler para o processamento de eventos de rastreamento.
 * 
 * @param {Request} req - Requisição contendo uma lista de 'events' no corpo JSON.
 * @returns {Promise<Response>} Status de sucesso ou erro.
 */
Deno.serve(async (req) => {
  // Tratamento de preflight CORS
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

    // Inserção em lote (limite de 50 eventos por chamada para performance)
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
