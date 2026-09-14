/**
 * @file supabase/functions/integracao/index.ts
 * @description Receptor de webhooks de pagamento (ZenixPay e compatíveis).
 *
 * Endpoint público: POST /functions/v1/integracao/webhooks
 *
 * Fluxo:
 * 1. Recebe a notificação do gateway (JSON).
 * 2. Extrai o identificador da transação e o status, em vários formatos possíveis.
 * 3. Se o status for final e aprovado (AUTHORIZED / PAID / APPROVED), marca o pedido
 *    correspondente como 'paid' na tabela 'orders' — é isso que libera o acesso ao
 *    produto para o cliente (a tela de PIX detecta o pedido pago e avança).
 * 4. Sempre responde 2xx quando o corpo é válido, pois o gateway repete o envio
 *    (3 tentativas, 15s) até receber uma resposta 2xx.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Cabeçalhos CORS padrão. */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Status que representam pagamento aprovado (libera o produto). */
const APPROVED = ['AUTHORIZED', 'PAID', 'APPROVED', 'CONFIRMED', 'COMPLETED'];

/** Status finais de recusa/cancelamento. */
const FAILED = ['REJECTED', 'FAILED', 'CANCELLED', 'CANCELED', 'REFUNDED', 'CHARGED_BACK'];

/**
 * Procura recursivamente, em um objeto de payload, a primeira chave presente na lista.
 *
 * @param {any} obj - Objeto (possivelmente aninhado) recebido do gateway.
 * @param {string[]} keys - Nomes de chave aceitos, em ordem de prioridade.
 * @returns {string | null} Valor encontrado como string, ou null.
 */
function findValue(obj: any, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') {
      const found = findValue(value, keys);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Manipulador HTTP do webhook.
 *
 * @param {Request} req - Requisição enviada pelo gateway de pagamento.
 * @returns {Promise<Response>} 200 quando processado, 400 para corpo inválido.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const path = new URL(req.url).pathname;

  // Aceita apenas o caminho /integracao/webhooks (e a raiz da função, por segurança).
  if (!path.endsWith('/webhooks') && !path.endsWith('/integracao') && path !== '/') {
    return new Response(JSON.stringify({ error: 'Endpoint não encontrado' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    let payload: any;
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Corpo da requisição inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook recebido:', JSON.stringify(payload));

    const transactionId = findValue(payload, [
      'transactionId', 'transaction_id', 'paymentId', 'payment_id', 'id', 'hash',
    ]);
    const rawStatus = (findValue(payload, ['status', 'paymentStatus', 'payment_status']) || '').toUpperCase();

    if (!transactionId) {
      // Responde 2xx para não gerar reenvios infinitos de um payload que não sabemos tratar.
      console.warn('Webhook sem identificador de transação — ignorado.');
      return new Response(JSON.stringify({ received: true, ignored: 'sem transaction id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let newStatus: string | null = null;
    if (APPROVED.includes(rawStatus)) newStatus = 'paid';
    else if (FAILED.includes(rawStatus)) newStatus = 'failed';

    if (newStatus) {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ status: newStatus })
        .eq('transaction_id', String(transactionId))
        .select('id, amount');

      // Pagamento aprovado: envia CompletePayment ao TikTok pela API de Eventos.
      // O event_id é o ID da transação, o mesmo usado no navegador, para não contar duas vezes.
      if (!error && newStatus === 'paid') {
        try {
          const order: any = data?.[0] ?? {};
          // 'amount' é gravado em centavos pelo create-pix — o TikTok espera o valor em reais.
          const cents = Number(order.amount ?? 0);
          const value = Number.isFinite(cents) && cents > 0 ? cents / 100 : undefined;
          await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-event`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              event: 'CompletePayment',
              event_id: String(transactionId),
              value,
              currency: 'BRL',
              content_id: 'escada-telescopica',
              content_name: 'Escada Telescópica',
            }),
          });
        } catch (trackErr) {
          // Falha de rastreamento nunca deve impedir a liberação do pedido.
          console.warn('Falha ao enviar CompletePayment ao TikTok:', trackErr);
        }
      }


      if (error) {
        console.error('Erro ao atualizar pedido:', error);
        // 500 faz o gateway tentar novamente, o que é desejável aqui.
        return new Response(JSON.stringify({ error: 'Erro ao atualizar pedido' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      console.log(
        `Transação ${transactionId} (${rawStatus}) -> status "${newStatus}" em ${data?.length ?? 0} pedido(s).`,
      );
    } else {
      console.log(`Transação ${transactionId} com status intermediário "${rawStatus}" — nada a fazer.`);
    }

    return new Response(
      JSON.stringify({
        received: true,
        transaction_id: transactionId,
        raw_status: rawStatus || null,
        order_status: newStatus,
        released: newStatus === 'paid',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
