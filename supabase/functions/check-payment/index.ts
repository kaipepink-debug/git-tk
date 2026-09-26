/**
 * @file supabase/functions/check-payment/index.ts
 * @description Consulta de status usada pela tela do PIX. Apenas LÊ o status salvo
 * (atualizado pelo webhook validado da KirvusPay). Nunca aprova pagamento.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  try {
    let body: any = null;
    try { body = await req.json(); } catch { /* inválido */ }
    const transactionId = typeof body?.transaction_id === 'string' ? body.transaction_id.trim().slice(0, 100) : '';
    if (!transactionId) return json({ error: 'transaction_id obrigatório' }, 400);

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: ord } = await supabaseAdmin.from('orders').select('status')
      .eq('transaction_id', transactionId).maybeSingle();
    const st = ord?.status ?? 'not_found';
    // Só o status é devolvido — nenhum dado do cliente.
    return json({ status: st === 'paid' ? 'paid' : st === 'pix_generated' ? 'pending' : st });
  } catch (error) {
    console.error('Erro check-payment:', error instanceof Error ? error.message : error);
    return json({ error: 'Erro interno' }, 500);
  }
});
