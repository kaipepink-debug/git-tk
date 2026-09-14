/**
 * @file TransactionsPanel.tsx
 * @description Painel de transações do gateway ZenixPay. Lista cada transação
 * com status, valor e data, atualizando automaticamente via Realtime + polling.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw, CreditCard, Search, Copy, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * @interface Transaction
 * @description Transação (pedido com transaction_id do gateway).
 */
interface Transaction {
  id: string;
  transaction_id: string | null;
  customer_name: string;
  customer_email: string;
  amount: number;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
}

/** Configuração visual por status interno. */
const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pix_generated: { label: "Aguardando Pagamento", bg: "hsl(45,100%,10%)", text: "hsl(45,100%,60%)" },
  pending: { label: "Pendente", bg: "hsl(210,50%,10%)", text: "hsl(210,100%,65%)" },
  paid: { label: "Pago", bg: "hsl(145,50%,10%)", text: "hsl(145,70%,55%)" },
  failed: { label: "Recusado", bg: "hsl(0,50%,10%)", text: "hsl(0,84%,60%)" },
  cancelled: { label: "Cancelado", bg: "hsl(0,50%,10%)", text: "hsl(0,84%,60%)" },
};

/** Formata centavos em BRL. */
const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Formata data ISO para pt-BR com hora. */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * @component TransactionsPanel
 * @description Tela de transações do ZenixPay com atualização automática.
 */
const TransactionsPanel = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  /**
   * Busca as transações (pedidos com transaction_id) mais recentes.
   * @param {boolean} silent - Quando true, não exibe o estado de carregamento.
   */
  const fetchTransactions = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, transaction_id, customer_name, customer_email, amount, quantity, status, created_at, updated_at")
        .not("transaction_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setTransactions((data as Transaction[]) || []);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Erro ao carregar transações:", err);
      if (!silent) toast.error("Não foi possível carregar as transações.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial + polling de 15s + Realtime na tabela de pedidos
  useEffect(() => {
    fetchTransactions();

    const interval = setInterval(() => fetchTransactions(true), 15000);

    const channel = supabase
      .channel("transactions-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchTransactions(true);
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions]);

  /** Copia o ID da transação para a área de transferência. */
  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Não foi possível copiar o ID.");
    }
  };

  const filtered = transactions.filter(t => {
    const matchSearch = !search ||
      (t.transaction_id || "").toLowerCase().includes(search.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.customer_email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = transactions.filter(t => t.status === "paid").reduce((s, t) => s + t.amount, 0);
  const pendingCount = transactions.filter(t => t.status === "pix_generated" || t.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Transações", value: String(transactions.length) },
          { label: "Aprovadas (valor)", value: formatBRL(totalPaid) },
          { label: "Aguardando", value: String(pendingCount) },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-[hsl(220,15%,12%)] bg-[hsl(220,22%,7%)] p-4">
            <p className="text-[10px] uppercase tracking-wide text-[hsl(220,10%,40%)]">{card.label}</p>
            <p className="text-lg font-semibold text-white mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-[hsl(220,15%,12%)] bg-[hsl(220,22%,7%)] overflow-hidden">
        {/* Cabeçalho e filtros */}
        <div className="p-4 border-b border-[hsl(220,15%,12%)] flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[hsl(14,100%,55%)]" />
            <h2 className="text-sm font-semibold text-white">Transações ZenixPay</h2>
            <span className="text-[10px] text-[hsl(220,10%,40%)]">
              atualizado {formatDate(lastUpdate.toISOString()).split(" ")[1]}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(220,10%,35%)]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar ID, nome ou email"
                className="pl-8 pr-3 py-2 rounded-lg bg-[hsl(220,20%,6%)] border border-[hsl(220,15%,16%)] text-white text-xs outline-none focus:border-[hsl(14,100%,55%)] w-56"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="py-2 px-2 rounded-lg bg-[hsl(220,20%,6%)] border border-[hsl(220,15%,16%)] text-white text-xs outline-none focus:border-[hsl(14,100%,55%)]"
            >
              <option value="all">Todos os status</option>
              <option value="pix_generated">Aguardando Pagamento</option>
              <option value="paid">Pago</option>
              <option value="failed">Recusado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <button
              onClick={() => fetchTransactions()}
              className="p-2 rounded-lg bg-[hsl(220,20%,6%)] border border-[hsl(220,15%,16%)] text-[hsl(220,10%,60%)] hover:text-white transition-colors"
              aria-label="Atualizar transações"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="p-8 text-center text-xs text-[hsl(220,10%,40%)]">Carregando transações...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-[hsl(220,10%,40%)]">Nenhuma transação encontrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wide text-[hsl(220,10%,35%)] border-b border-[hsl(220,15%,12%)]">
                  <th className="px-4 py-3 font-medium">Transação</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Valor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const cfg = statusConfig[t.status] || { label: t.status, bg: "hsl(220,20%,10%)", text: "hsl(220,10%,60%)" };
                  return (
                    <tr key={t.id} className="border-b border-[hsl(220,15%,10%)] hover:bg-[hsl(220,20%,8%)] transition-colors">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => t.transaction_id && copyId(t.transaction_id)}
                          className="flex items-center gap-1.5 font-mono text-[hsl(220,10%,70%)] hover:text-white"
                        >
                          {t.transaction_id}
                          {copied === t.transaction_id ? <Check className="w-3 h-3 text-[hsl(145,70%,55%)]" /> : <Copy className="w-3 h-3 opacity-50" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white">{t.customer_name}</p>
                        <p className="text-[10px] text-[hsl(220,10%,40%)]">{t.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{formatBRL(t.amount)}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium"
                          style={{ background: cfg.bg, color: cfg.text }}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[hsl(220,10%,55%)]">{formatDate(t.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPanel;
