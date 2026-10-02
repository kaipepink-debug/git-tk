/**
 * @file supabase/functions/integracao/index.ts
 * @description Webhook de pagamento da KirvusPay (único gateway).
 *
 * Endpoint: POST /functions/v1/integracao/webhooks/kirvuspay
 *
 * 1. Localiza o pedido pelo transaction.id e valida o token do aviso (webhookToken salvo).
 * 2. Em TRANSACTION_PAID, consulta a transação direto na KirvusPay (status COMPLETED)
 *    e confere o valor pago contra o valor esperado salvo.
 * 3. A transição para "paid" é atômica: só a primeira confirmação envia o
 *    CompletePayment ao TikTok. Depois envia à RastroCode (idempotente, não bloqueia).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchKirvusStatus, pickAmount, amountMatches } from "../_shared/kirvus.ts";
import { PRODUCT } from "../_shared/pricing.ts";
import { sendToRastroCode } from "../_shared/rastrocode.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (!new URL(req.url).pathname.endsWith('/webhooks/kirvuspay')) return json({ error: 'Endpoint não encontrado' }, 404);
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    let payload: any;
    try { payload = await req.json(); } catch { return json({ error: 'Corpo da requisição inválido' }, 400); }

    const transactionId = typeof payload?.transaction?.id === 'string' ? payload.transaction.id.trim() : '';
    const ev = String(payload?.event || '');
    // Log sem dados pessoais do cliente.
    console.log(`Webhook Kirvus: ${ev} ${transactionId}`);
    if (!transactionId) return json({ error: 'transaction.id ausente' }, 400);

    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: ord } = await supabaseAdmin.from('orders')
      .select('id, status, amount, kirvus_webhook_token')
      .eq('transaction_id', transactionId).maybeSingle();
    if (!ord) return json({ received: true, order_found: false });

    // Autenticidade: token do aviso = webhookToken devolvido na criação desta transação.
    if (!ord.kirvus_webhook_token || payload?.token !== ord.kirvus_webhook_token) {
      console.warn('Kirvus: token do webhook inválido', transactionId);
      return json({ error: 'webhook não autenticado' }, 401);
    }

    if (['TRANSACTION_CANCELED', 'TRANSACTION_REFUNDED', 'TRANSACTION_CHARGED_BACK'].includes(ev)) {
      await supabaseAdmin.from('orders').update({ status: 'failed' })
        .eq('id', ord.id).neq('status', 'paid');
      return json({ received: true, order_status: 'failed' });
    }
    if (ev !== 'TRANSACTION_PAID') return json({ received: true, order_status: null });

    // ===== Confirmação servidor-a-servidor =====
    const chk = await fetchKirvusStatus(transactionId);
    if (!chk.ok) { console.error('Consulta Kirvus falhou:', chk.error); return json({ error: 'verificação pendente' }, 500); }
    if ((chk.status || '').toUpperCase() !== 'COMPLETED') {
      console.log(`Transação ${transactionId} ainda não concluída (${chk.status}).`);
      return json({ received: true, order_status: null });
    }

    // ===== Valor pago x valor esperado =====
    const expected = Number(ord.amount);
    const paid = chk.amount ?? pickAmount(payload?.transaction);
    if (paid === null || paid === undefined) {
      // A Kirvus não informou valor: o PIX foi criado pelo servidor com o valor recalculado.
      console.warn(`Transação ${transactionId}: valor não informado pela Kirvus; usando o valor criado pelo servidor.`);
    } else if (!amountMatches(paid, expected)) {
      console.error(`Valor divergente em ${transactionId}: pago ${paid}, esperado ${expected} centavos.`);
      await supabaseAdmin.from('orders').update({ status: 'amount_mismatch' }).eq('id', ord.id).neq('status', 'paid');
      return json({ received: true, order_status: 'amount_mismatch' });
    }

    // ===== Transição atômica pending -> paid (trava de idempotência) =====
    const nowIso = new Date().toISOString();
    const { data: transitioned, error: transitionError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'paid', paid_at: nowIso, tt_purchase_sent_at: nowIso })
      .eq('id', ord.id)
      .neq('status', 'paid')
      .is('tt_purchase_sent_at', null)
      .select('id, amount, quantity, items, ttclid, ttp, utm, customer_email, customer_phone');
    if (transitionError) {
      console.error('Erro ao confirmar pedido:', transitionError.message);
      return json({ error: 'Erro ao atualizar pedido' }, 500);
    }
    const first = transitioned?.[0] ?? null;

    // ===== TikTok CompletePayment (somente na primeira confirmação) =====
    if (first) {
      try {
        const cents = Number(first.amount ?? 0);
        const value = Number.isFinite(cents) && cents > 0 ? cents / 100 : undefined;
        const res = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/tiktok-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            event: 'CompletePayment',
            event_id: `purchase-${transactionId}`,
            value,
            currency: 'BRL',
            content_id: (first.items as any)?.product?.id || PRODUCT.id,
            content_name: (first.items as any)?.product?.name || PRODUCT.name,
            quantity: Number(first.quantity) > 0 ? Number(first.quantity) : 1,
            order_id: String(first.id),
            external_id: String(transactionId),
            ttclid: first.ttclid || undefined,
            ttp: first.ttp || undefined,
            utm: first.utm || undefined,
            click_id: (first.utm && (first.utm as any).click_id) || undefined,
            email: first.customer_email || undefined,
            phone: first.customer_phone || undefined,
          }),
        });
        if (!res.ok) {
          const details = await res.text();
          console.error(`Envio de CompletePayment falhou [${res.status}]: ${details.slice(0, 300)}`);
          // Libera a marca para nova tentativa num próximo webhook (o pedido continua pago).
          await supabaseAdmin.from('orders').update({ tt_purchase_sent_at: null }).eq('id', ord.id);
        }
      } catch (trackErr) {
        console.warn('Falha ao enviar CompletePayment ao TikTok:', trackErr);
      }
    } else {
      console.log(`Transação ${transactionId} já confirmada antes — conversão não duplicada.`);
    }

    // ===== RastroCode (idempotente; falha não afeta o pagamento) =====
    try {
      const r = await sendToRastroCode(supabaseAdmin, transactionId);
      console.log('RastroCode:', r.info.slice(0, 120));
    } catch (e) {
      console.warn('Falha RastroCode:', e);
    }

    return json({ received: true, transaction_id: transactionId, order_status: 'paid', released: true });
  } catch (error) {
    console.error('Erro no webhook:', error instanceof Error ? error.message : error);
    return json({ error: 'Erro interno' }, 500);
  }
});
