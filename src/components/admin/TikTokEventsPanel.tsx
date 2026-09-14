/**
 * @file TikTokEventsPanel.tsx
 * @description Painel com os eventos enviados ao Pixel do TikTok. Mostra o total de
 * visualizações de produto, pedidos e pagamentos, além da lista completa dos eventos
 * (navegador e servidor), com atualização automática via Realtime + polling de 15s.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, Activity, Eye, ShoppingCart, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";

/**
 * @interface TikTokEvent
 * @description Registro de um evento enviado ao TikTok.
 */
interface TikTokEvent {
  id: string;
  event_name: string;
  event_id: string | null;
  source: string;
  value: number | null;
  currency: string;
  page: string | null;
  status: string;
  created_at: string;
}

/** Nome amigável de cada evento padrão do TikTok. */
const eventLabels: Record<string, string> = {
  Pageview: "Visualização de página",
  ViewContent: "Visualização do produto",
  AddToCart: "Adicionou ao carrinho",
  InitiateCheckout: "Iniciou o checkout",
  AddPaymentInfo: "Informou o pagamento",
  PlaceAnOrder: "Pedido feito",
  CompletePayment: "Pagamento concluído",
};

/** Formata um valor em reais. */
const formatBRL = (value: number | null) =>
  value == null ? "—" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Formata data ISO em pt-BR com hora. */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * @component TikTokEventsPanel
 * @description Tela de acompanhamento dos eventos recebidos pelo pixel do TikTok.
 */
const TikTokEventsPanel = () => {
  const [events, setEvents] = useState<TikTokEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  /**
   * Busca os eventos mais recentes (limite de 300).
   *
   * @param {boolean} silent - Quando true, não exibe o estado de carregamento.
   */
  const fetchEvents = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("tiktok_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

      if (error) throw error;
      setEvents((data as TikTokEvent[]) ?? []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Erro ao carregar eventos do TikTok:", err);
      if (!silent) toast.error("Não foi possível carregar os eventos. Tente novamente.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carrega e mantém atualizado (Realtime + polling de segurança a cada 15s).
  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("tiktok-events-panel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "tiktok_events" }, () =>
        fetchEvents(true),
      )
      .subscribe();

    const interval = setInterval(() => fetchEvents(true), 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchEvents]);

  /** Totais por tipo de evento, para os cards de resumo. */
  const totals = useMemo(() => {
    const count = (name: string) => events.filter((e) => e.event_name === name).length;
    return {
      views: count("ViewContent"),
      carts: count("AddToCart"),
      orders: count("PlaceAnOrder"),
      payments: count("CompletePayment"),
      total: events.length,
    };
  }, [events]);

  /** Lista de nomes de evento presentes, para o filtro. */
  const eventNames = useMemo(
    () => Array.from(new Set(events.map((e) => e.event_name))).sort(),
    [events],
  );

  /** Eventos após busca e filtro. */
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return events.filter((e) => {
      const matchesFilter = eventFilter === "all" || e.event_name === eventFilter;
      const matchesTerm =
        !term ||
        e.event_name.toLowerCase().includes(term) ||
        (e.event_id ?? "").toLowerCase().includes(term) ||
        (e.page ?? "").toLowerCase().includes(term);
      return matchesFilter && matchesTerm;
    });
  }, [events, search, eventFilter]);

  const cards = [
    { label: "Visualizações do produto", value: totals.views, icon: Eye },
    { label: "Adições ao carrinho", value: totals.carts, icon: ShoppingCart },
    { label: "Pedidos", value: totals.orders, icon: Activity },
    { label: "Pagamentos concluídos", value: totals.payments, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">Eventos do TikTok</h2>
          <p className="text-xs text-muted-foreground">
            Atualizado às {lastUpdate.toLocaleTimeString("pt-BR")} · atualização automática
          </p>
        </div>
        <button
          onClick={() => fetchEvents()}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" />
              <span className="text-xs">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Busca e filtro */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por evento, identificador ou página"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
        >
          <option value="all">Todos os eventos</option>
          {eventNames.map((name) => (
            <option key={name} value={name}>
              {eventLabels[name] ?? name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Evento</th>
              <th className="px-4 py-3 font-medium">Origem</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Página</th>
              <th className="px-4 py-3 font-medium">Identificador</th>
              <th className="px-4 py-3 font-medium">Resultado</th>
              <th className="px-4 py-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Carregando eventos...
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum evento registrado ainda.
                </td>
              </tr>
            )}

            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-medium text-foreground">
                  {eventLabels[e.event_name] ?? e.event_name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {e.source === "server" ? "Servidor" : "Navegador"}
                </td>
                <td className="px-4 py-3 text-foreground">{formatBRL(e.value)}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.page ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {e.event_id ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2 py-1 text-xs font-semibold"
                    style={
                      e.status === "sent"
                        ? { background: "hsl(145,50%,10%)", color: "hsl(145,70%,55%)" }
                        : { background: "hsl(0,50%,10%)", color: "hsl(0,84%,60%)" }
                    }
                  >
                    {e.status === "sent" ? "Enviado" : e.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(e.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TikTokEventsPanel;
