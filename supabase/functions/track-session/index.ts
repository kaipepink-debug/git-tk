/**
 * @file supabase/functions/track-session/index.ts
 * @description Função para gerenciar o rastreamento de sessões ativas no site.
 * 
 * Permite registrar a presença de um usuário em uma página específica ou marcar o fim da sessão.
 * Também realiza a limpeza de sessões obsoletas através de um procedimento armazenado no banco de dados.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Cabeçalhos CORS.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Handler para o gerenciamento de sessões de usuário.
 * 
 * @param {Request} req - Requisição com session_id, page, user_agent e action no corpo JSON.
 * @returns {Promise<Response>} Status de sucesso ou erro.
 */
serve(async (req) => {
  // Tratamento de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { session_id, page, user_agent, action } = await req.json();

    // Se a ação for 'leave', remove a sessão ativa
    if (action === 'leave') {
      await supabaseAdmin.from('active_sessions').delete().eq('session_id', session_id);
      // Limpeza preventiva de sessões paradas (stale)
      await supabaseAdmin.rpc('cleanup_stale_sessions');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Atualiza ou insere a sessão atual (Upsert)
    const { error } = await supabaseAdmin
      .from('active_sessions')
      .upsert(
        { session_id, page, user_agent, last_seen_at: new Date().toISOString() },
        { onConflict: 'session_id' }
      );

    if (error) throw error;

    // Executa a limpeza de sessões obsoletas no banco de dados
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
