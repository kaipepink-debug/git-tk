/**
 * @file supabase/functions/create-pix/index.ts
 * @description Gera o PIX pela KirvusPay (único gateway).
 *
 * 1. Recebe os itens escolhidos (quantidade, frete, order bumps) e os dados do cliente.
 * 2. Recalcula o total no servidor (_shared/pricing.ts) — o valor do navegador é ignorado.
 * 3. Cria o PIX na KirvusPay e grava o registro mínimo em `orders` (status pix_generated).
 * 4. Devolve o código Copia e Cola e o QR Code.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { kirvusHeaders, KIRVUS_BASE } from "../_shared/kirvus.ts";
import { priceOrder } from "../_shared/pricing.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: 'Corpo da requisição inválido' }, 400); }

    // ===== Valor calculado SOMENTE no servidor =====
    // O preço sai da tabela `products` — a mesma que o painel edita e a vitrine lê.
    const slug = typeof body?.items?.product === 'string' && body.items.product ? body.items.product : 'produto';
    const banco = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: catalogo, error: erroCatalogo } = await banco
      .from('products').select('slug, title, variants').eq('slug', slug).eq('active', true).maybeSingle();
    if (erroCatalogo) {
      console.error('Erro ao ler o produto:', erroCatalogo.message);
      return json({ error: 'Não foi possível carregar o produto. Tente novamente.' }, 503);
    }
    const priced = priceOrder(body?.items, catalogo);
    if (!priced.ok) return json({ error: priced.error }, 400);
    const { total, qty, items } = priced.order;

    // O navegador informa o total que mostrou; se divergir, não gera o PIX
    // (evita cobrar um valor diferente do exibido).
    if (body?.expected_amount !== undefined && Number(body.expected_amount) !== total) {
      return json({ error: 'O valor do pedido mudou. Recarregue a página e tente novamente.' }, 409);
    }

    // ===== Dados do cliente =====
    const customer = body?.customer || {};
    const name = str(customer.name, 120);
    const email = str(customer.email, 160);
    const cleanDoc = String(customer.document ?? '').replace(/\D/g, '');
    const cleanPhone = String(customer.phone_number ?? '').replace(/\D/g, '').slice(0, 13);
    const cleanCep = String(customer.zip_code ?? '').replace(/\D/g, '').slice(0, 8);

    if (!name || !email || !cleanDoc) return json({ error: 'Dados do cliente incompletos. Preencha nome, e-mail e CPF.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'E-mail do cliente inválido' }, 400);
    if (cleanDoc.length !== 11) return json({ error: 'CPF inválido. Informe um CPF com 11 dígitos.' }, 400);

    const ttclid = str(body?.ttclid, 512) || null;
    const ttp = str(body?.ttp, 512) || null;
    const utm = body?.utm && typeof body.utm === 'object' && !Array.isArray(body.utm) && Object.keys(body.utm).length
      ? body.utm : null;

    // ===== KirvusPay =====
    const headers = kirvusHeaders();
    if (!headers) {
      console.error('Credenciais Kirvus ausentes');
      return json({ error: 'Pagamento indisponível no momento. Tente novamente mais tarde.' }, 503);
    }

    const identifier = `ord-${crypto.randomUUID()}`;
    const totalReais = Number((total / 100).toFixed(2));
    const response = await fetch(`${KIRVUS_BASE}/gateway/pix/receive`, {
      method: 'POST', headers,
      body: JSON.stringify({
        identifier,
        amount: totalReais,
        client: { name, email, phone: cleanPhone || undefined, document: cleanDoc },
        products: [{ id: 'pedido', name: 'Pedido da loja', quantity: 1, price: totalReais }],
        metadata: { provider: 'loja', identifier },
        callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/integracao/webhooks/kirvuspay`,
      }),
    });
    const responseText = await response.text();
    let data: any = null;
    try { data = JSON.parse(responseText); } catch { /* texto */ }
    if (!response.ok || !data?.transactionId || data?.status === 'FAILED') {
      console.error(`Kirvus erro [${response.status}]`);
      return json({ error: 'Erro ao gerar PIX', details: data?.message || data?.errorDescription }, 502);
    }
    const transactionId = String(data.transactionId);
    const pixCode = data?.pix?.code || '';
    const pixQrCodeBase64 = data?.pix?.base64 || '';
    if (!pixCode) return json({ error: 'A Kirvus não retornou o código PIX' }, 502);

    // ===== Registro mínimo (necessário para validar o webhook) =====
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: dbError } = await supabaseAdmin.from('orders').insert({
      customer_name: name,
      customer_email: email,
      customer_document: cleanDoc,
      customer_phone: cleanPhone || null,
      amount: total, // centavos — valor esperado
      quantity: qty,
      items,
      status: 'pix_generated',
      pix_code: pixCode,
      pix_qr_code: pixQrCodeBase64,
      transaction_id: transactionId,
      tiktok_event_id: `purchase-${transactionId}`,
      customer_city: str(customer.city, 100) || null,
      customer_state: str(customer.state, 2) || null,
      customer_cep: cleanCep || null,
      customer_street: str(customer.street_name || customer.street, 200) || null,
      customer_number: customer.number ? String(customer.number).slice(0, 20) : null,
      customer_neighborhood: str(customer.neighborhood, 120) || null,
      customer_complement: str(customer.complement, 120) || null,
      ttclid,
      ttp,
      utm,
      kirvus_webhook_token: data.webhookToken ? String(data.webhookToken) : null,
    });
    if (dbError) {
      // Sem registro, o pagamento não poderia ser validado — não entrega o PIX.
      console.error('Erro ao salvar pedido:', dbError.message);
      return json({ error: 'Não foi possível registrar o pedido. Tente novamente.' }, 500);
    }

    return json({
      pix: { pix_qr_code: pixCode, qr_code_base64: pixQrCodeBase64 },
      id: transactionId,
      amount: total,
    });
  } catch (error) {
    console.error('Erro create-pix:', error instanceof Error ? error.message : error);
    return json({ error: 'Erro interno' }, 500);
  }
});
