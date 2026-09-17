/**
 * @file supabase/functions/tiktok-event/index.ts
 * @description Camada ÚNICA de envio de eventos para a Events API do TikTok (server-side).
 *
 * Garantias implementadas:
 * - O token (`TIKTOK_ACCESS_TOKEN`) e o Pixel ID (`TIKTOK_PIXEL_ID`) vivem SOMENTE aqui,
 *   como secrets do servidor. Nunca são devolvidos na resposta nem registrados em log.
 * - Deduplicação: um mesmo `event_name` + `event_id` só é enviado UMA vez pelo servidor
 *   (índice único no banco). Webhook reenviado, clique duplo ou retry do gateway não
 *   geram evento duplicado.
 * - Retry controlado: no máximo 3 tentativas, apenas para falhas temporárias (rede/5xx),
 *   com espera crescente. Nunca há laço infinito.
 * - Log técnico completo em `tiktok_events` (status, HTTP, erro, tentativas, ttclid, UTMs).
 *
 * Corpo aceito:
 * {
 *   event: "CompletePayment" | "ViewContent" | ...,
 *   event_id: string,                 // determinístico; compartilhado com o Pixel
 *   value?: number, currency?: "BRL",
 *   content_id?, content_name?, quantity?, description?,
 *   email?, phone?, external_id?,     // Advanced Matching (somente com consentimento)
 *   ttclid?, ttp?, utm?: object,
 *   url?, referrer?, user_agent?, ip?, order_id?
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

/** Endpoint da Events API 2.0 do TikTok. */
const TIKTOK_ENDPOINT = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

/** Número máximo de tentativas de envio (1 original + 2 reenvios). */
const MAX_ATTEMPTS = 3;

/**
 * Cliente administrativo do banco (usado para log e deduplicação).
 *
 * @returns {ReturnType<typeof createClient> | null} Cliente ou null quando indisponível.
 */
function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Gera hash SHA-256 em hexadecimal, formato exigido pelo TikTok para dados de contato.
 *
 * @param {string} value - Valor em texto puro.
 * @returns {Promise<string>} Hash hexadecimal minúsculo.
 */
async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Pausa simples entre tentativas. */
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Manipulador HTTP: valida a entrada, deduplica, envia ao TikTok e registra o resultado.
 *
 * @param {Request} req - Requisição com o evento.
 * @returns {Promise<Response>} Resposta JSON com o resultado do envio.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  const supabase = adminClient();
  let logId: string | null = null;

  try {
    const accessToken = Deno.env.get('TIKTOK_ACCESS_TOKEN');
    const pixelId = Deno.env.get('TIKTOK_PIXEL_ID');

    if (!accessToken || !pixelId) {
      console.error('Events API não configurada: falta TIKTOK_ACCESS_TOKEN ou TIKTOK_PIXEL_ID.');
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

    const eventId = body?.event_id ? String(body.event_id) : crypto.randomUUID();
    const currency = String(body?.currency || 'BRL');
    const pageUrl = body?.url ? String(body.url) : null;
    const ttclid = typeof body?.ttclid === 'string' && body.ttclid.trim() ? body.ttclid.trim() : null;
    const ttp = typeof body?.ttp === 'string' && body.ttp.trim() ? body.ttp.trim() : null;
    const utm = body?.utm && typeof body.utm === 'object' && Object.keys(body.utm).length ? body.utm : null;
    const contentId = body?.content_id ? String(body.content_id) : null;
    const rawValue = Number(body?.value);
    const value = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : null;
    const externalIdRaw = body?.external_id ? String(body.external_id) : null;
    const clickId = typeof body?.click_id === 'string' && body.click_id.trim() ? body.click_id.trim() : null;
    // Log técnico: guarda o click_id junto dos parâmetros de campanha, para o painel.
    const utmLog = clickId ? { ...(utm || {}), click_id: clickId } : utm;

    // ---------------------------------------------------------------------
    // Deduplicação: a linha de log funciona como "reserva" do envio. O índice
    // único (event_name, event_id) impede um segundo envio do mesmo evento.
    // ---------------------------------------------------------------------
    const logRow = {
      event_name: eventName,
      event_id: eventId,
      source: 'server',
      value,
      currency,
      page: pageUrl,
      status: 'enviando',
      ttclid,
      ttp,
      content_id: contentId,
      // Identificador da transação/pedido em texto (não é dado pessoal). O hash
      // exigido pelo TikTok é calculado apenas no envio.
      external_id: externalIdRaw,
      utm: utmLog,
      retry_count: 0,
    };

    if (supabase) {
      const { data, error } = await supabase.from('tiktok_events').insert(logRow).select('id').single();
      if (error) {
        // 23505 = violação de índice único → o evento já foi enviado antes.
        if ((error as any).code === '23505') {
          console.log(`Evento ${eventName} (${eventId}) ignorado: já enviado anteriormente.`);
          await supabase.from('tiktok_events').insert({
            ...logRow, status: 'duplicado', dedup_blocked: true,
          });
          return json({ success: true, deduplicated: true, event: eventName, event_id: eventId });
        }
        console.warn('Não foi possível registrar o evento no painel:', error.message);
      } else {
        logId = data?.id ?? null;
      }
    }

    /** Atualiza a linha de log com o resultado final. */
    const finish = async (fields: Record<string, unknown>) => {
      if (!supabase || !logId) return;
      await supabase.from('tiktok_events').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', logId);
    };

    // ---------------------------------------------------------------------
    // Montagem dos dados do usuário (Advanced Matching). Só entram valores reais.
    // ---------------------------------------------------------------------
    const user: Record<string, string> = {};
    if (typeof body?.email === 'string' && body.email.includes('@')) {
      user.email = await sha256(body.email.trim().toLowerCase());
    }
    if (typeof body?.phone === 'string' && body.phone.trim()) {
      const digits = body.phone.replace(/\D/g, '');
      if (digits.length >= 10) user.phone = await sha256(`+55${digits.slice(-11)}`);
    }
    if (externalIdRaw) user.external_id = await sha256(externalIdRaw);
    // IP: usa o informado ou, na falta, o IP real da requisição (melhora a correspondência).
    const forwardedIp = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    const ip = (typeof body?.ip === 'string' && body.ip) ? body.ip : forwardedIp;
    if (ip) user.ip = ip;
    if (typeof body?.user_agent === 'string' && body.user_agent) user.user_agent = body.user_agent;
    if (ttclid) user.ttclid = ttclid;
    if (ttp) user.ttp = ttp;

    // Propriedades do evento.
    const properties: Record<string, unknown> = { currency };
    if (value !== null) properties.value = value;
    if (body?.order_id) properties.order_id = String(body.order_id);
    if (body?.description) properties.description = String(body.description);
    // Click ID de outro rastreador: informativo. NUNCA vai para user.ttclid.
    if (typeof body?.click_id === 'string' && body.click_id.trim()) {
      properties.click_id = body.click_id.trim().slice(0, 255);
    }
    if (contentId) {
      const quantity = Number(body?.quantity) > 0 ? Number(body.quantity) : 1;
      properties.content_type = 'product';
      properties.content_id = contentId;
      properties.contents = [{
        content_id: contentId,
        content_type: 'product',
        content_name: body?.content_name ? String(body.content_name) : undefined,
        price: value !== null ? Number((value / quantity).toFixed(2)) : undefined,
        quantity,
      }];
    }

    // Parâmetros de campanha (Utmify/UTMs): enviados como propriedades do evento
    // para que o TikTok relacione o evento ao anúncio de origem.
    if (utm) {
      for (const [key, raw] of Object.entries(utm as Record<string, unknown>)) {
        if (raw === null || raw === undefined || raw === '') continue;
        properties[key] = String(raw).slice(0, 255);
      }
    }

    // URL da página com os parâmetros de campanha preservados (quando ausentes).
    let pageUrlWithUtm = pageUrl;
    if (pageUrl && utm) {
      try {
        const parsed = new URL(pageUrl);
        for (const [key, raw] of Object.entries(utm as Record<string, unknown>)) {
          if (raw === null || raw === undefined || raw === '') continue;
          if (!parsed.searchParams.has(key)) parsed.searchParams.set(key, String(raw));
        }
        if (ttclid && !parsed.searchParams.has('ttclid')) parsed.searchParams.set('ttclid', ttclid);
        pageUrlWithUtm = parsed.toString();
      } catch {
        // URL inválida — mantém o valor original.
      }
    }

    const payload = {
      event_source: 'web',
      event_source_id: pixelId,
      data: [{
        event: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user,
        page: pageUrlWithUtm ? { url: pageUrlWithUtm, referrer: body?.referrer ? String(body.referrer) : undefined } : undefined,
        properties,
      }],
    };

    // ---------------------------------------------------------------------
    // Envio com retry controlado (somente falhas temporárias são reenviadas).
    // ---------------------------------------------------------------------
    let attempt = 0;
    let lastStatus = 0;
    let lastError = '';

    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      try {
        const response = await fetch(TIKTOK_ENDPOINT, {
          method: 'POST',
          headers: { 'Access-Token': accessToken, 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const text = await response.text();
        lastStatus = response.status;

        if (!response.ok) {
          lastError = text.slice(0, 500);
          console.error(`Events API falhou [${response.status}] tentativa ${attempt}: ${lastError}`);
          // 4xx é erro definitivo: não faz sentido reenviar.
          if (response.status < 500) break;
          await wait(attempt * 800);
          continue;
        }

        // A API responde 200 mesmo em erro lógico — o campo "code" precisa ser 0.
        let parsed: any = null;
        try { parsed = JSON.parse(text); } catch { /* resposta não-JSON */ }
        if (parsed && parsed.code !== 0) {
          lastError = String(parsed.message || text).slice(0, 500);
          console.error(`Events API recusou o evento (code ${parsed.code}): ${lastError}`);
          await finish({ status: 'recusado', http_status: response.status, error_message: lastError, retry_count: attempt - 1 });
          return json({ error: 'TikTok recusou o evento', details: parsed }, 400);
        }

        await finish({ status: 'sent', http_status: response.status, error_message: null, retry_count: attempt - 1 });
        console.log(`Evento ${eventName} enviado ao TikTok (event_id: ${eventId}, tentativas: ${attempt}).`);
        return json({ success: true, event: eventName, event_id: eventId, attempts: attempt });
      } catch (err) {
        lastError = String(err).slice(0, 500);
        console.error(`Falha de rede ao enviar ${eventName} (tentativa ${attempt}): ${lastError}`);
        if (attempt < MAX_ATTEMPTS) await wait(attempt * 800);
      }
    }

    await finish({ status: 'fail', http_status: lastStatus || null, error_message: lastError, retry_count: attempt - 1 });
    return json({ error: 'Falha ao enviar evento ao TikTok', status: lastStatus, details: lastError }, 502);
  } catch (error) {
    console.error('Erro inesperado no envio de evento:', error);
    if (supabase && logId) {
      await supabase.from('tiktok_events')
        .update({ status: 'fail', error_message: String(error).slice(0, 500) })
        .eq('id', logId);
    }
    return json({ error: 'Erro interno ao enviar evento.' }, 500);
  }
});
