/**
 * @file SalesChart.tsx
 * @description Componente de gráfico de vendas que permite alternar entre visualização de área e barras, exibindo pedidos e faturamento.
 */

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts";
import { useMemo, useState } from "react";

/**
 * @interface Order
 * @description Estrutura de um pedido para o gráfico.
 */
interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

/**
 * @interface SalesChartProps
 * @description Propriedades do componente SalesChart.
 * @property {Order[]} orders - Lista de pedidos.
 * @property {("today" | "7days" | "30days")} period - Período de tempo para filtrar os dados.
 */
interface SalesChartProps {
  orders: Order[];
  period: "today" | "7days" | "30days";
}

/**
 * @component SalesChart
 * @description Renderiza gráficos de desempenho de vendas (pedidos e faturamento) ao longo do tempo.
 * @param {SalesChartProps} props - Propriedades do componente.
 */
const SalesChart = ({ orders, period }: SalesChartProps) => {
  const [chartType, setChartType] = useState<"area" | "bar">("area");

  /**
   * Prepara os dados para o Recharts com base no período selecionado.
   */
  const chartData = useMemo(() => {
    const now = new Date();
    // Visão horária para o período "hoje"
    if (period === "today") {
      const hours: Record<string, { label: string; vendas: number; valor: number }> = {};
      for (let i = 0; i < 24; i++) {
        hours[i] = { label: `${i.toString().padStart(2, "0")}h`, vendas: 0, valor: 0 };
      }
      orders.forEach((o) => {
        const d = new Date(o.created_at);
        if (d.toDateString() === now.toDateString()) {
          hours[d.getHours()].vendas += 1;
          if (o.status === "paid") hours[d.getHours()].valor += o.amount / 100;
        }
      });
      return Object.values(hours);
    }
    // Visão diária para 7 ou 30 dias
    const days = period === "7days" ? 7 : 30;
    const result: { label: string; vendas: number; valor: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const dayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === d.toDateString());
      result.push({
        label: key,
        vendas: dayOrders.length,
        valor: dayOrders.filter((o) => o.status === "paid").reduce((s, o) => s + o.amount / 100, 0),
      });
    }
    return result;
  }, [orders, period]);

  /**
   * @component CustomTooltip
   * @description Tooltip customizado para exibir valores formatados em moeda e quantidade.
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[hsl(220,25%,10%)] border border-[hsl(220,15%,20%)] rounded-lg px-3 py-2.5 shadow-xl">
        <p className="text-[10px] text-[hsl(220,10%,50%)] mb-1.5">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[hsl(220,10%,60%)]">{p.name === "valor" ? "Faturamento" : "Pedidos"}:</span>
            <span className="font-semibold text-white">
              {p.name === "valor" ? `R$ ${p.value.toFixed(2)}` : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
      {/* Cabeçalho do Gráfico */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Vendas por {period === "today" ? "Hora" : "Dia"}</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)] mt-0.5">Pedidos e faturamento no período</p>
        </div>
        <div className="flex items-center gap-0.5 bg-[hsl(220,20%,8%)] rounded-lg p-0.5 border border-[hsl(220,15%,18%)]">
          <button
            onClick={() => setChartType("area")}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
              chartType === "area" ? "bg-[hsl(220,20%,18%)] text-white" : "text-[hsl(220,10%,40%)]"
            }`}
          >
            Área
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all ${
              chartType === "bar" ? "bg-[hsl(220,20%,18%)] text-white" : "text-[hsl(220,10%,40%)]"
            }`}
          >
            Barras
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[hsl(210,100%,65%)]" />
          <span className="text-[10px] text-[hsl(220,10%,50%)]">Pedidos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[hsl(145,70%,50%)]" />
          <span className="text-[10px] text-[hsl(220,10%,50%)]">Faturamento</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "area" ? (
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="vendasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(210,100%,65%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(210,100%,65%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="valorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(145,70%,50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(145,70%,50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,15%)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "hsl(220,10%,40%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220,10%,40%)", fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="vendas" stroke="hsl(210,100%,65%)" fill="url(#vendasGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="valor" stroke="hsl(145,70%,50%)" fill="url(#valorGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          ) : (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,15%)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "hsl(220,10%,40%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(220,10%,40%)", fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="vendas" fill="hsl(210,100%,65%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="valor" fill="hsl(145,70%,50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesChart;
