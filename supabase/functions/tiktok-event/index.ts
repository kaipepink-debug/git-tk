/**
 * @file supabase/functions/tiktok-event/index.ts
 * @description Envio de eventos ao TikTok pela API de Eventos (server-side).
 *
 * Usado para eventos que precisam de confiabilidade (ex.: CompletePayment confirmado
 * pelo webhook do gateway). O token de acesso e o ID do pixel ficam apenas no servidor.
 *
 * Corpo esperado:
 * {
 *   event: "CompletePayment",
 *   event_id: "PL5Z48284G48",        // usado para deduplicar com o pixel do navegador
 *   value?: 99.9, currency?: "BRL",
 *   content_id?: string, content_name?: string,
 *   email?: string, phone?: string,   // enviados apenas se houver consentimento
 *   url?: string, user_agent?: string, ip?: string
 * }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Cabeçalhos CORS padrão. */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Endpoint da API de Eventos 2.0 do TikTok. */
const TIKTOK_ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

/**
 * Gera o hash SHA-256 em hexadecimal, formato exigido para dados de contato.
 *
 * @param {string} value - Valor em texto puro.
 * @returns {Promise<string>} Hash em hexadecimal minúsculo.
 */
async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Registra o evento na tabela `tiktok_events` para acompanhamento no painel admin.
 * Falhas de registro nunca interrompem o envio ao TikTok.
 *
 * @param {Record<string, unknown>} row - Dados do evento a registrar.
 */
async function logEvent(row: Record<string, unknown>) {
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return;
    const supabase = createClient(url, key);
    await supabase.from('tiktok_events').insert(row);
  } catch (err) {
    console.warn('Não foi possível registrar o evento no painel:', err);
  }
}

/**
 * Manipulador HTTP: valida a entrada e repassa o evento ao TikTok.
 *
 * @param {Request} req - Requisição com o evento a ser enviado.
 * @returns {Promise<Response>} Resposta JSON com o resultado do envio.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN');
    const pixelId = Deno.env.get('TIKTOK_PIXEL_ID');

    if (!accessToken || !pixelId) {
      console.error('TIKTOK_ACCESS_TOKEN ou TIKTOK_PIXEL_ID não configurados.');
      return json({ error: 'Rastreamento do TikTok não configurado no servidor.' }, 503);
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Corpo da requisição inválido.' }, 400);
    }

    const eventName = typeof body?.event === 'string' ? body.event.trim() : '';
    if (!eventName) return json({ error: 'Campo "event" é obrigatório.' }, 400);

    // Dados de contato (opcionais) sempre com hash — só chegam aqui com consentimento.
    const user: Record<string, string> = {};
    if (typeof body?.email === 'string' && body.email.includes('@')) {
      user.email = await sha256(body.email.trim().toLowerCase());
    }
    if (typeof body?.phone === 'string' && body.phone.trim()) {
      const digits = body.phone.replace(/\D/g, '');
      if (digits.length >= 10) user.phone = await sha256(`+${digits}`);
    }
    if (typeof body?.ip === 'string' && body.ip) user.ip = body.ip;
    if (typeof body?.user_agent === 'string' && body.user_agent) user.user_agent = body.user_agent;
    // Identificador do clique no anúncio: essencial para o TikTok atribuir a venda.
    if (typeof body?.ttclid === 'string' && body.ttclid.trim()) user.ttclid = body.ttclid.trim();
    if (typeof body?.ttp === 'string' && body.ttp.trim()) user.ttp = body.ttp.trim();

    const properties: Record<string, unknown> = { currency: body?.currency || 'BRL' };
    if (body?.order_id) properties.order_id = String(body.order_id);
    const value = Number(body?.value);
    if (Number.isFinite(value) && value > 0) properties.value = value;
    if (body?.content_id) {
      properties.contents = [{
        content_id: String(body.content_id),
        content_type: 'product',
        content_name: body?.content_name ? String(body.content_name) : undefined,
        price: Number.isFinite(value) && value > 0 ? value : undefined,
        quantity: Number(body?.quantity) > 0 ? Number(body.quantity) : 1,
      }];
      properties.content_type = 'product';
    }

    const payload = {
      event_source: 'web',
      event_source_id: pixelId,
      data: [{
        event: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: body?.event_id ? String(body.event_id) : crypto.randomUUID(),
        user,
        page: body?.url ? { url: String(body.url) } : undefined,
        properties,
      }],
    };

    const response = await fetch(TIKTOK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error(`TikTok API falhou [${response.status}]: ${text}`);
      await logEvent({
        event_name: eventName, event_id: payload.data[0].event_id, source: 'server',
        value: properties.value ?? null, currency: String(properties.currency ?? 'BRL'),
        page: body?.url ? String(body.url) : null, status: `erro ${response.status}`,
      });
      return json({ error: 'Falha ao enviar evento ao TikTok', status: response.status, details: text }, response.status);
    }

    // A API do TikTok responde 200 mesmo em erro lógico — verificar o campo "code".
    let parsed: any = null;
    try { parsed = JSON.parse(text); } catch { /* resposta não-JSON */ }
    if (parsed && parsed.code !== 0) {
      console.error('TikTok API retornou erro lógico:', text);
      await logEvent({
        event_name: eventName, event_id: payload.data[0].event_id, source: 'server',
        value: properties.value ?? null, currency: String(properties.currency ?? 'BRL'),
        page: body?.url ? String(body.url) : null, status: 'recusado',
      });
      return json({ error: 'TikTok recusou o evento', details: parsed }, 400);
    }

    await logEvent({
      event_name: eventName, event_id: payload.data[0].event_id, source: 'server',
      value: properties.value ?? null, currency: String(properties.currency ?? 'BRL'),
      page: body?.url ? String(body.url) : null, status: 'sent',
    });

    console.log(`Evento ${eventName} enviado ao TikTok (event_id: ${payload.data[0].event_id}).`);
    return json({ success: true, event: eventName, response: parsed ?? text });
  } catch (error) {
    console.error('Erro inesperado no envio de evento:', error);
    return json({ error: 'Erro interno ao enviar evento.' }, 500);
  }
});
