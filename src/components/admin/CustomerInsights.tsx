/**
 * @file CustomerInsights.tsx
 * @description Componente que exibe insights detalhados sobre os clientes, incluindo geografia (cidades/estados), horários de pico e ranking de compradores.
 */

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { MapPin, Users, Smartphone, Monitor, TrendingUp, Clock } from "lucide-react";

/**
 * @interface Order
 * @description Representação de um pedido com dados do cliente.
 */
interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_city?: string | null;
  customer_state?: string | null;
  amount: number;
  status: string;
  created_at: string;
  quantity: number;
}

/**
 * @interface CustomerInsightsProps
 * @description Propriedades do componente CustomerInsights.
 */
interface CustomerInsightsProps {
  orders: Order[];
  dateRange: { from: Date; to: Date };
}

/**
 * Cores utilizadas para as fatias dos gráficos.
 */
const COLORS = [
  "hsl(14,100%,55%)", "hsl(210,100%,65%)", "hsl(145,70%,50%)",
  "hsl(45,100%,60%)", "hsl(280,80%,65%)", "hsl(170,70%,50%)",
  "hsl(330,80%,55%)", "hsl(200,80%,55%)",
];

/**
 * @component CustomTooltip
 * @description Tooltip para os gráficos de pizza.
 */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[hsl(220,25%,10%)] border border-[hsl(220,15%,20%)] rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[11px] font-medium text-white">{payload[0].name}</p>
      <p className="text-[10px] text-[hsl(220,10%,50%)]">{payload[0].value} pedidos</p>
    </div>
  );
};

/**
 * @component CustomerInsights
 * @description Painel de análise de comportamento e perfil do cliente.
 * @param {CustomerInsightsProps} props - Propriedades do componente.
 */
const CustomerInsights = ({ orders, dateRange }: CustomerInsightsProps) => {
  // Filtra pedidos pelo intervalo de data selecionado
  const filtered = useMemo(() => {
    return orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= dateRange.from && d <= dateRange.to;
    });
  }, [orders, dateRange]);

  // Agrupa pedidos por cidade para o ranking
  const cityData = useMemo(() => {
    const map: Record<string, { total: number; paid: number; revenue: number }> = {};
    filtered.forEach(o => {
      const city = o.customer_city || "Não informado";
      if (!map[city]) map[city] = { total: 0, paid: 0, revenue: 0 };
      map[city].total++;
      if (o.status === "paid") {
        map[city].paid++;
        map[city].revenue += o.amount / 100;
      }
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filtered]);

  // Agrupa pedidos por estado para a distribuição geográfica
  const stateData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(o => {
      const state = o.customer_state || "N/A";
      map[state] = (map[state] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filtered]);

  // Ranking de maiores compradores baseado em receita total
  const topCustomers = useMemo(() => {
    const map: Record<string, { name: string; orders: number; revenue: number; paid: number }> = {};
    filtered.forEach(o => {
      const key = o.customer_email;
      if (!map[key]) map[key] = { name: o.customer_name, orders: 0, revenue: 0, paid: 0 };
      map[key].orders++;
      if (o.status === "paid") {
        map[key].paid++;
        map[key].revenue += o.amount / 100;
      }
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [filtered]);

  // Distribuição de pedidos por hora do dia
  const hourlyData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, "0")}h`, orders: 0, paid: 0 }));
    filtered.forEach(o => {
      const h = new Date(o.created_at).getHours();
      hours[h].orders++;
      if (o.status === "paid") hours[h].paid++;
    });
    return hours;
  }, [filtered]);

  // Métricas rápidas de resumo
  const uniqueCustomers = new Set(filtered.map(o => o.customer_email)).size;
  const uniqueCities = new Set(filtered.filter(o => o.customer_city).map(o => o.customer_city)).size;
  const avgOrdersPerCustomer = uniqueCustomers > 0 ? (filtered.length / uniqueCustomers).toFixed(1) : "0";
  const peakHour = hourlyData.reduce((max, h) => h.orders > max.orders ? h : max, hourlyData[0]);

  const statCards = [
    { label: "Clientes Únicos", value: uniqueCustomers, icon: Users, color: "hsl(210,100%,65%)", bg: "hsl(210,100%,10%)" },
    { label: "Cidades", value: uniqueCities, icon: MapPin, color: "hsl(14,100%,55%)", bg: "hsl(14,100%,10%)" },
    { label: "Pedidos/Cliente", value: avgOrdersPerCustomer, icon: TrendingUp, color: "hsl(145,70%,50%)", bg: "hsl(145,70%,10%)" },
    { label: "Horário Pico", value: peakHour.hour, icon: Clock, color: "hsl(45,100%,60%)", bg: "hsl(45,100%,10%)" },
  ];

  return (
    <div className="space-y-4">
      {/* Resumo de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(card => (
          <div key={card.label} className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: card.bg }}>
                <card.icon className="w-4.5 h-4.5" style={{ color: card.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white tabular-nums">{card.value}</p>
            <p className="text-[10px] text-[hsl(220,10%,42%)] mt-1 uppercase tracking-wider font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Ranking de Cidades */}
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Top Cidades</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)] mb-4">Cidades com mais pedidos</p>
          {cityData.length === 0 ? (
            <p className="text-xs text-[hsl(220,10%,35%)] py-8 text-center">Nenhum dado de cidade disponível</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {cityData.map((city, i) => {
                const maxCount = cityData[0]?.total || 1;
                return (
                  <div key={city.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] w-5 h-5 rounded flex items-center justify-center bg-[hsl(220,20%,16%)] text-[hsl(220,10%,50%)] font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-[11px] text-[hsl(220,10%,60%)] truncate">{city.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[9px] text-[hsl(145,70%,50%)]">
                          {city.paid > 0 ? `R$ ${city.revenue.toFixed(0)}` : "—"}
                        </span>
                        <span className="text-xs font-bold text-white tabular-nums">{city.total}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[hsl(220,20%,14%)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(city.total / maxCount) * 100}%`,
                          background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}88)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gráfico de Distribuição por Estado */}
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Distribuição por Estado</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)] mb-4">Pedidos por unidade federativa</p>
          {stateData.length === 0 ? (
            <p className="text-xs text-[hsl(220,10%,35%)] py-8 text-center">Nenhum dado disponível</p>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-1/2">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stateData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} strokeWidth={0}>
                      {stateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {stateData.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-[hsl(220,10%,60%)]">{s.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-white tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico de Barras por Horário */}
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Pedidos por Horário</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)] mb-4">Distribuição ao longo do dia</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourlyData} barCategoryGap="15%">
              <XAxis
                dataKey="hour"
                tick={{ fill: "hsl(220,10%,40%)", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                interval={2}
              />
              <YAxis tick={{ fill: "hsl(220,10%,40%)", fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip
                content={({ active, payload, label }: any) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-[hsl(220,25%,10%)] border border-[hsl(220,15%,20%)] rounded-lg px-3 py-2 shadow-xl">
                      <p className="text-[10px] text-[hsl(220,10%,50%)]">{label}</p>
                      <p className="text-xs font-bold text-white">{payload[0].value} pedidos</p>
                      {payload[1] && <p className="text-xs text-[hsl(145,70%,50%)]">{payload[1].value} pagos</p>}
                    </div>
                  );
                }}
              />
              <Bar dataKey="orders" fill="hsl(210,100%,65%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="paid" fill="hsl(145,70%,50%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de Ranking de Clientes */}
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Top Clientes</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)] mb-4">Maiores compradores por receita</p>
          {topCustomers.length === 0 ? (
            <p className="text-xs text-[hsl(220,10%,35%)] py-8 text-center">Nenhum cliente encontrado</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[hsl(220,20%,14%)] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[9px] w-5 h-5 rounded flex items-center justify-center bg-[hsl(220,20%,16%)] text-[hsl(220,10%,50%)] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-white truncate">{c.name}</p>
                      <p className="text-[9px] text-[hsl(220,10%,35%)]">{c.orders} pedido{c.orders > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-bold text-[hsl(145,70%,50%)]">
                      R$ {c.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-[hsl(220,10%,35%)]">{c.paid} pago{c.paid > 1 ? "s" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerInsights;
