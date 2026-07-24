import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface ConversionTrendsProps {
  orders: Order[];
  dateRange: { from: Date; to: Date };
}

const ConversionTrends = ({ orders, dateRange }: ConversionTrendsProps) => {
  const data = useMemo(() => {
    const diffDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000);
    
    if (diffDays <= 1) {
      // Hourly view
      const hours: Record<number, { total: number; paid: number }> = {};
      for (let i = 0; i < 24; i++) hours[i] = { total: 0, paid: 0 };
      orders.forEach(o => {
        const d = new Date(o.created_at);
        if (d >= dateRange.from && d <= dateRange.to) {
          hours[d.getHours()].total++;
          if (o.status === "paid") hours[d.getHours()].paid++;
        }
      });
      return Object.entries(hours).map(([h, v]) => ({
        label: `${h.padStart(2, "0")}h`,
        taxa: v.total > 0 ? Number(((v.paid / v.total) * 100).toFixed(1)) : 0,
        pedidos: v.total,
        pagos: v.paid,
      }));
    }

    // Daily view
    const result: { label: string; taxa: number; pedidos: number; pagos: number }[] = [];
    for (let i = 0; i < diffDays; i++) {
      const d = new Date(dateRange.from.getTime() + i * 86400000);
      const dayOrders = orders.filter(o => {
        const od = new Date(o.created_at);
        return od.toDateString() === d.toDateString();
      });
      const paid = dayOrders.filter(o => o.status === "paid").length;
      result.push({
        label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        taxa: dayOrders.length > 0 ? Number(((paid / dayOrders.length) * 100).toFixed(1)) : 0,
        pedidos: dayOrders.length,
        pagos: paid,
      });
    }
    return result;
  }, [orders, dateRange]);

  return (
    <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">Tendência de Conversão</h3>
        <p className="text-[10px] text-[hsl(220,10%,40%)] mt-0.5">Taxa de conversão PIX ao longo do tempo</p>
      </div>
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[hsl(14,100%,55%)]" />
          <span className="text-[10px] text-[hsl(220,10%,50%)]">Taxa Conversão %</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[hsl(210,100%,65%)]" />
          <span className="text-[10px] text-[hsl(220,10%,50%)]">Pedidos</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,15%)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "hsl(220,10%,40%)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: "hsl(220,10%,40%)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(220,10%,40%)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
          <Tooltip
            content={({ active, payload, label }: any) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-[hsl(220,25%,10%)] border border-[hsl(220,15%,20%)] rounded-lg px-3 py-2 shadow-xl">
                  <p className="text-[10px] text-[hsl(220,10%,50%)] mb-1">{label}</p>
                  <p className="text-xs text-[hsl(14,100%,55%)]">Conversão: {payload[0]?.value}%</p>
                  <p className="text-xs text-[hsl(210,100%,65%)]">Pedidos: {payload[1]?.value}</p>
                </div>
              );
            }}
          />
          <Line yAxisId="left" type="monotone" dataKey="taxa" stroke="hsl(14,100%,55%)" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="pedidos" stroke="hsl(210,100%,65%)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ConversionTrends;
