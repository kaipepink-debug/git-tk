/**
 * @file TikTokDiagnostics.tsx
 * @description Painel de diagnóstico do rastreamento do TikTok.
 *
 * Mostra, em tempo real:
 * - Situação do Pixel no navegador e da Events API no servidor.
 * - Identificadores capturados nesta sessão (Click ID, cookie do pixel, UTMs).
 * - Último evento de cada tipo, com origem (navegador/servidor), status, HTTP e erro.
 * - Contagem das últimas 24 h: enviados, falhas e duplicados bloqueados.
 *
 * O token da Events API NUNCA é exibido: apenas a confirmação de que está configurado.
 */

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getAttribution, getFirstAttribution, getTrackingSessionId } from "@/lib/tracking/attribution";
import { TIKTOK_PIXEL_ID } from "@/lib/tracking/tiktok";

/** Estrutura de uma linha do log técnico de eventos. */
interface EventRow {
  id: string;
  event_name: string;
  event_id: string | null;
  source: string;
  value: number | null;
  currency: string;
  page: string | null;
  status: string;
  http_status: number | null;
  error_message: string | null;
  retry_count: number;
  dedup_blocked: boolean;
  ttclid: string | null;
  ttp: string | null;
  external_id: string | null;
  content_id: string | null;
  utm: Record<string, unknown> | null;
  created_at: string;
}

/** Ordem do funil usada na exibição. */
const FUNNEL = [
  "Pageview",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "AddPaymentInfo",
  "PlaceAnOrder",
  "CompletePayment",
];

/**
 * Formata data/hora no padrão brasileiro.
 *
 * @param {string} iso - Data em ISO.
 * @returns {string} Data legível.
 */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/**
 * Encurta valores longos para exibição segura na tela.
 *
 * @param {string | null} value - Valor a encurtar.
 * @returns {string} Valor abreviado ou "—".
 */
const short = (value: string | null) =>
  !value ? "—" : value.length <= 22 ? value : `${value.slice(0, 10)}…${value.slice(-8)}`;

/**
 * Painel de diagnóstico do rastreamento.
 *
 * @returns {JSX.Element} Cartões de status e tabela de eventos por etapa do funil.
 */
const TikTokDiagnostics = () => {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pixelReady, setPixelReady] = useState(false);

  const attribution = useMemo(() => getAttribution(), []);
  const firstTouch = useMemo(() => getFirstAttribution(), []);
  const sessionId = useMemo(() => getTrackingSessionId(), []);

  // Carrega os eventos das últimas 24 h e mantém atualizado.
  useEffect(() => {
    const since = () => new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const load = async () => {
      const { data, error } = await supabase
        .from("tiktok_events")
        .select("*")
        .gte("created_at", since())
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) console.error("Erro ao carregar diagnóstico do TikTok:", error);
      setRows((data as EventRow[]) || []);
      setLoading(false);
    };

    load();
    const timer = setInterval(load, 15000);
    const channel = supabase
      .channel("tiktok-diagnostics")
      .on("postgres_changes", { event: "*", schema: "public", table: "tiktok_events" }, load)
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Verifica se o Pixel está carregado nesta aba do navegador.
  useEffect(() => {
    const check = () => setPixelReady(Boolean((window as any).ttq));
    check();
    const timer = setInterval(check, 2000);
    return () => clearInterval(timer);
  }, []);

  const sent = rows.filter((r) => r.status === "sent").length;
  const failed = rows.filter((r) => r.status === "fail" || r.status === "recusado").length;
  const duplicated = rows.filter((r) => r.dedup_blocked || r.status === "duplicado").length;
  const serverOk = rows.some((r) => r.source === "server" && r.status === "sent");

  /** Contagens de qualidade dos dados enviados (últimas 24 h). */
  const semTtclid = rows.filter((r) => !r.ttclid).length;
  const semClickId = rows.filter((r) => !(r.utm && (r.utm as any).click_id)).length;
  const semUtm = rows.filter((r) => !r.utm || Object.keys(r.utm).length === 0).length;
  const semEventId = rows.filter((r) => !r.event_id).length;
  const porPixel = rows.filter((r) => r.source === "browser").length;
  const porEventsApi = rows.filter((r) => r.source === "server").length;
  const porUtmify = rows.filter((r) => r.source === "utmify").length;
  const utmifyAtivo = typeof window !== "undefined" && Boolean(document.querySelector("script[data-utmify-pixel]"));
  const webhookOk = rows.some((r) => r.event_name === "CompletePayment" && r.source === "server" && r.status === "sent");

  /** Último evento registrado para cada etapa do funil e origem. */
  const lastByEvent = (name: string, source?: string) =>
    rows.find((r) => r.event_name === name && (!source || r.source === source) && !r.dedup_blocked);

  const cards = [
    { label: "Pixel no navegador", value: pixelReady ? "Ativo" : "Não carregado", ok: pixelReady },
    { label: "ID do Pixel", value: TIKTOK_PIXEL_ID, ok: true },
    { label: "Envio pelo servidor", value: serverOk ? "Funcionando" : "Sem envios ainda", ok: serverOk },
    { label: "Token da Events API", value: "Guardado no servidor (oculto)", ok: true },
    { label: "Eventos enviados (24 h)", value: String(sent), ok: sent > 0 },
    { label: "Falhas (24 h)", value: String(failed), ok: failed === 0 },
    { label: "Duplicados bloqueados", value: String(duplicated), ok: true },
    { label: "Pixel da Utmify", value: utmifyAtivo ? "Carregado" : "Não carregado", ok: utmifyAtivo },
    { label: "Eventos da Utmify (24 h)", value: String(porUtmify), ok: true },
    { label: "Aviso de pagamento (webhook)", value: webhookOk ? "Conversão confirmada" : "Sem conversão nas 24 h", ok: webhookOk },
    { label: "Pelo Pixel / Events API", value: `${porPixel} / ${porEventsApi}`, ok: porPixel > 0 && porEventsApi > 0 },
    { label: "Sem ttclid", value: String(semTtclid), ok: semTtclid === 0 },
    { label: "Sem click_id", value: String(semClickId), ok: true },
    { label: "Sem parâmetros de campanha", value: String(semUtm), ok: semUtm === 0 },
    { label: "Sem event_id", value: String(semEventId), ok: semEventId === 0 },
  ];

  return (
    <div className="space-y-4">
      {/* Cartões de status geral */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-sm font-semibold mt-1 ${c.ok ? "text-foreground" : "text-destructive"}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Identificadores capturados nesta sessão */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Identificadores desta sessão</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Click ID (atual)</dt><dd className="font-mono">{short(attribution.ttclid)}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Click ID (1º clique)</dt><dd className="font-mono">{short(firstTouch.ttclid)}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Cookie do pixel (_ttp)</dt><dd className="font-mono">{short(attribution.ttp)}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Sessão de rastreamento</dt><dd className="font-mono">{short(sessionId)}</dd></div>
          <div className="flex justify-between gap-2 sm:col-span-2">
            <dt className="text-muted-foreground">Parâmetros de campanha</dt>
            <dd className="font-mono text-right">
              {Object.keys(attribution.utm).length
                ? Object.entries(attribution.utm).map(([k, v]) => `${k}=${v}`).join(" · ")
                : "—"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Último evento de cada etapa do funil */}
      <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold text-foreground mb-3">Último evento por etapa do funil</h3>
        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="py-2 pr-3">Evento</th>
                <th className="py-2 pr-3">Navegador</th>
                <th className="py-2 pr-3">Servidor</th>
                <th className="py-2 pr-3">event_id</th>
                <th className="py-2 pr-3">Valor</th>
                <th className="py-2 pr-3">HTTP</th>
                <th className="py-2 pr-3">Tentativas</th>
                <th className="py-2">Quando</th>
              </tr>
            </thead>
            <tbody>
              {FUNNEL.map((name) => {
                const browser = lastByEvent(name, "browser");
                const server = lastByEvent(name, "server");
                const latest = server || browser;
                return (
                  <tr key={name} className="border-b border-border/50">
                    <td className="py-2 pr-3 font-medium text-foreground">{name}</td>
                    <td className="py-2 pr-3">{browser ? "✅" : "—"}</td>
                    <td className="py-2 pr-3">
                      {server ? (server.status === "sent" ? "✅" : `⚠️ ${server.status}`) : "—"}
                    </td>
                    <td className="py-2 pr-3 font-mono">{short(latest?.event_id ?? null)}</td>
                    <td className="py-2 pr-3">{latest?.value ? `R$ ${Number(latest.value).toFixed(2)}` : "—"}</td>
                    <td className="py-2 pr-3">{server?.http_status ?? "—"}</td>
                    <td className="py-2 pr-3">{server?.retry_count ?? 0}</td>
                    <td className="py-2">{latest ? fmtDate(latest.created_at) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Erros recentes */}
      {failed > 0 && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Erros recentes</h3>
          <ul className="space-y-1 text-xs">
            {rows
              .filter((r) => r.status === "fail" || r.status === "recusado")
              .slice(0, 8)
              .map((r) => (
                <li key={r.id} className="text-muted-foreground">
                  <span className="font-medium text-foreground">{r.event_name}</span> · {fmtDate(r.created_at)} ·
                  HTTP {r.http_status ?? "—"} · {r.error_message?.slice(0, 140) || "sem detalhe"}
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Detalhamento dos últimos eventos registrados */}
      <div className="rounded-lg border border-border bg-card p-4 overflow-x-auto">
        <h3 className="text-sm font-semibold text-foreground mb-3">Últimos eventos (detalhado)</h3>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2 pr-3">Quando</th>
              <th className="py-2 pr-3">Evento</th>
              <th className="py-2 pr-3">Origem</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">HTTP</th>
              <th className="py-2 pr-3">Valor</th>
              <th className="py-2 pr-3">event_id</th>
              <th className="py-2 pr-3">ttclid</th>
              <th className="py-2 pr-3">click_id</th>
              <th className="py-2 pr-3">Campanha</th>
              <th className="py-2 pr-3">Pedido</th>
              <th className="py-2">Resposta / erro</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 40).map((r) => {
              const utm = (r.utm || {}) as Record<string, unknown>;
              const clickId = utm.click_id ? String(utm.click_id) : null;
              const campanha = [utm.utm_source, utm.utm_medium, utm.utm_campaign]
                .filter(Boolean)
                .join(" · ");
              return (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="py-2 pr-3 font-medium text-foreground">{r.event_name}</td>
                  <td className="py-2 pr-3">
                    {r.source === "browser" ? "Navegador" : r.source === "server" ? "Events API" : "Utmify"}
                  </td>
                  <td className={`py-2 pr-3 ${r.status === "sent" ? "" : "text-destructive"}`}>{r.status}</td>
                  <td className="py-2 pr-3">{r.http_status ?? "—"}</td>
                  <td className="py-2 pr-3">{r.value ? `R$ ${Number(r.value).toFixed(2)}` : "—"}</td>
                  <td className="py-2 pr-3 font-mono">{short(r.event_id)}</td>
                  <td className="py-2 pr-3 font-mono">{short(r.ttclid)}</td>
                  <td className="py-2 pr-3 font-mono">{short(clickId)}</td>
                  <td className="py-2 pr-3">{campanha || "—"}</td>
                  <td className="py-2 pr-3 font-mono">{short(r.external_id)}</td>
                  <td className="py-2">{r.error_message ? r.error_message.slice(0, 80) : r.status === "sent" ? "OK (code 0)" : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TikTokDiagnostics;
