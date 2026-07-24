import { useMemo } from "react";
import { DollarSign, TrendingUp, Percent, ShoppingBag } from "lucide-react";

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  quantity: number;
}

interface RevenueBreakdownProps {
  orders: Order[];
  dateRange: { from: Date; to: Date };
}

const RevenueBreakdown = ({ orders, dateRange }: RevenueBreakdownProps) => {
  const stats = useMemo(() => {
    const filtered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= dateRange.from && d <= dateRange.to;
    });

    const paid = filtered.filter(o => o.status === "paid");
    const pixGenerated = filtered.filter(o => o.status === "pix_generated" || o.status === "paid");
    const totalRevenue = paid.reduce((s, o) => s + o.amount, 0) / 100;
    const totalUnits = paid.reduce((s, o) => s + o.quantity, 0);
    const avgTicket = paid.length > 0 ? totalRevenue / paid.length : 0;
    const conversionRate = pixGenerated.length > 0 ? (paid.length / pixGenerated.length) * 100 : 0;
    const potentialLost = pixGenerated.filter(o => o.status === "pix_generated").reduce((s, o) => s + o.amount, 0) / 100;

    // Previous period
    const diffMs = dateRange.to.getTime() - dateRange.from.getTime();
    const prevFrom = new Date(dateRange.from.getTime() - diffMs);
    const prevTo = new Date(dateRange.from.getTime());
    const prevFiltered = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= prevFrom && d < prevTo;
    });
    const prevPaid = prevFiltered.filter(o => o.status === "paid");
    const prevRevenue = prevPaid.reduce((s, o) => s + o.amount, 0) / 100;

    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : totalRevenue > 0 ? 100 : 0;

    return { totalRevenue, totalUnits, avgTicket, conversionRate, potentialLost, revenueChange, totalOrders: filtered.length, paidCount: paid.length };
  }, [orders, dateRange]);

  return (
    <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-1">Resumo de Receita</h3>
      <p className="text-[10px] text-[hsl(220,10%,40%)] mb-4">Visão consolidada do período</p>

      {/* Main revenue */}
      <div className="flex items-end gap-3 mb-5">
        <div>
          <p className="text-3xl font-bold text-white tracking-tight">
            R$ {stats.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${stats.revenueChange >= 0 ? "text-[hsl(145,70%,50%)] bg-[hsl(145,70%,10%)]" : "text-[hsl(0,84%,60%)] bg-[hsl(0,50%,10%)]"}`}>
              {stats.revenueChange >= 0 ? "↑" : "↓"} {Math.abs(stats.revenueChange).toFixed(0)}%
            </span>
            <span className="text-[10px] text-[hsl(220,10%,40%)]">vs período anterior</span>
          </div>
        </div>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[hsl(220,20%,8%)] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-3.5 h-3.5 text-[hsl(210,100%,65%)]" />
            <span className="text-[9px] text-[hsl(220,10%,42%)] uppercase tracking-wider">Unidades</span>
          </div>
          <p className="text-lg font-bold text-white">{stats.totalUnits}</p>
        </div>
        <div className="bg-[hsl(220,20%,8%)] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-[hsl(145,70%,50%)]" />
            <span className="text-[9px] text-[hsl(220,10%,42%)] uppercase tracking-wider">Ticket Médio</span>
          </div>
          <p className="text-lg font-bold text-white">R$ {stats.avgTicket.toFixed(2)}</p>
        </div>
        <div className="bg-[hsl(220,20%,8%)] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="w-3.5 h-3.5 text-[hsl(14,100%,55%)]" />
            <span className="text-[9px] text-[hsl(220,10%,42%)] uppercase tracking-wider">Conversão PIX</span>
          </div>
          <p className="text-lg font-bold text-white">{stats.conversionRate.toFixed(1)}%</p>
        </div>
        <div className="bg-[hsl(220,20%,8%)] rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-[hsl(45,100%,60%)]" />
            <span className="text-[9px] text-[hsl(220,10%,42%)] uppercase tracking-wider">Receita Pendente</span>
          </div>
          <p className="text-lg font-bold text-[hsl(45,100%,60%)]">R$ {stats.potentialLost.toFixed(2)}</p>
        </div>
      </div>

      {/* Conversion funnel mini */}
      <div className="mt-4 pt-4 border-t border-[hsl(220,15%,14%)]">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[hsl(220,10%,42%)]">Total pedidos: <span className="text-white font-bold">{stats.totalOrders}</span></span>
          <span className="text-[hsl(220,10%,42%)]">Pagos: <span className="text-[hsl(145,70%,50%)] font-bold">{stats.paidCount}</span></span>
        </div>
        <div className="mt-2 h-2 bg-[hsl(220,20%,14%)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${stats.totalOrders > 0 ? (stats.paidCount / stats.totalOrders) * 100 : 0}%`,
              background: "linear-gradient(90deg, hsl(145,70%,50%), hsl(145,70%,40%))",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RevenueBreakdown;
