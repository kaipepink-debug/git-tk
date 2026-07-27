/**
 * @file OrdersTable.tsx
 * @description Componente de tabela para exibição e gerenciamento de pedidos, incluindo busca, filtragem por status e exportação para CSV.
 */

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Download, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * @interface Order
 * @description Representação de um pedido na tabela.
 */
interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_document: string;
  customer_phone: string | null;
  amount: number;
  quantity: number;
  status: string;
  transaction_id: string | null;
  created_at: string;
}

/**
 * @interface OrdersTableProps
 * @description Propriedades do componente OrdersTable.
 * @property {Order[]} orders - Lista de pedidos a serem exibidos.
 */
interface OrdersTableProps {
  orders: Order[];
}

/**
 * Configuração visual para os diferentes status de pedido.
 */
const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pix_generated: { label: "PIX Gerado", bg: "hsl(45,100%,10%)", text: "hsl(45,100%,60%)", dot: "hsl(45,100%,60%)" },
  paid: { label: "Pago", bg: "hsl(145,50%,10%)", text: "hsl(145,70%,55%)", dot: "hsl(145,70%,50%)" },
  cancelled: { label: "Cancelado", bg: "hsl(0,50%,10%)", text: "hsl(0,84%,60%)", dot: "hsl(0,84%,60%)" },
  pending: { label: "Pendente", bg: "hsl(210,50%,10%)", text: "hsl(210,100%,65%)", dot: "hsl(210,100%,65%)" },
};

const ITEMS_PER_PAGE = 20;

/**
 * @component OrdersTable
 * @description Exibe uma lista paginada de pedidos com ferramentas de busca e filtro.
 * @param {OrdersTableProps} props - Propriedades do componente.
 */
const OrdersTable = ({ orders }: OrdersTableProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);

  /**
   * Atualiza o status de um pedido no banco de dados.
   */
  const updateStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
  };

  // Lógica de filtragem: busca por nome, email ou documento + filtro de status
  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_document.includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paged = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  // Calcula faturamento total apenas de vendas pagas
  const totalPaid = orders.filter(o => o.status === "paid").reduce((s, o) => s + o.amount, 0) / 100;

  /**
   * Gera e faz o download de um arquivo CSV com os dados filtrados.
   */
  const exportCSV = () => {
    const header = "Nome,Email,CPF,Telefone,Valor,Status,Data\n";
    const rows = filtered.map(o =>
      `"${o.customer_name}","${o.customer_email}","${o.customer_document}","${o.customer_phone || ""}","R$ ${(o.amount / 100).toFixed(2)}","${o.status}","${new Date(o.created_at).toLocaleString("pt-BR")}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl overflow-hidden">
      {/* Cabeçalho com busca e filtros */}
      <div className="px-5 py-4 border-b border-[hsl(220,15%,16%)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Pedidos</h3>
            <p className="text-[10px] text-[hsl(220,10%,40%)] mt-0.5">
              {filtered.length} pedidos • R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em vendas aprovadas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(220,10%,35%)]" />
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[hsl(220,20%,8%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)] transition-colors w-44"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="px-2.5 py-1.5 rounded-lg bg-[hsl(220,20%,8%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)]"
            >
              <option value="all">Todos</option>
              <option value="paid">Pagos</option>
              <option value="pix_generated">PIX Gerado</option>
              <option value="pending">Pendentes</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(220,20%,15%)] border border-[hsl(220,15%,22%)] text-[11px] text-[hsl(220,10%,60%)] hover:text-white hover:border-[hsl(220,15%,30%)] transition-all"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[hsl(220,15%,14%)]">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[hsl(220,10%,38%)] font-medium">Cliente</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[hsl(220,10%,38%)] font-medium">Valor</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[hsl(220,10%,38%)] font-medium">Qtd</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[hsl(220,10%,38%)] font-medium">Status</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[hsl(220,10%,38%)] font-medium">Data</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-[hsl(220,10%,38%)] font-medium">Ação</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center">
                  <p className="text-[hsl(220,10%,35%)] text-xs">Nenhum pedido encontrado</p>
                </td>
              </tr>
            ) : (
              paged.map((order) => {
                const cfg = statusConfig[order.status] || { label: order.status, bg: "hsl(220,15%,15%)", text: "hsl(220,10%,55%)", dot: "hsl(220,10%,55%)" };
                return (
                  <tr key={order.id} className="border-b border-[hsl(220,15%,12%)] hover:bg-[hsl(220,20%,13%)] transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium text-white">{order.customer_name}</p>
                      <p className="text-[10px] text-[hsl(220,10%,40%)]">{order.customer_email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-bold text-white tabular-nums">
                        R$ {(order.amount / 100).toFixed(2).replace(".", ",")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-[hsl(220,10%,60%)]">{order.quantity}x</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: cfg.bg, color: cfg.text }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-[10px] text-[hsl(220,10%,55%)]">
                          {new Date(order.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-[9px] text-[hsl(220,10%,35%)]">
                          {new Date(order.created_at).toLocaleTimeString("pt-BR")}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="bg-[hsl(220,20%,14%)] border border-[hsl(220,15%,20%)] text-white text-[10px] rounded-lg px-2 py-1.5 outline-none focus:border-[hsl(14,100%,55%)] cursor-pointer transition-colors"
                      >
                        <option value="pix_generated">PIX Gerado</option>
                        <option value="paid">Pago</option>
                        <option value="cancelled">Cancelado</option>
                        <option value="pending">Pendente</option>
                      </select>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-[hsl(220,15%,14%)] flex items-center justify-between">
          <span className="text-[10px] text-[hsl(220,10%,40%)]">
            Página {page + 1} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg hover:bg-[hsl(220,20%,15%)] disabled:opacity-30 text-[hsl(220,10%,50%)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-[hsl(220,20%,15%)] disabled:opacity-30 text-[hsl(220,10%,50%)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
