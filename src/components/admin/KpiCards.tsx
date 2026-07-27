/**
 * @file KpiCards.tsx
 * @description Conjunto de cartões que exibem os principais indicadores de desempenho (KPIs), comparando o período atual com o anterior.
 */

import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Target, CreditCard, CheckCircle, BarChart3 } from "lucide-react";

/**
 * @interface Order
 * @description Representação de um pedido para cálculo de métricas.
 */
interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  quantity: number;
}

/**
 * @interface KpiCardsProps
 * @description Propriedades do componente KpiCards.
 * @property {Order[]} orders - Lista completa de pedidos.
 * @property {("today" | "7days" | "30days")} period - Período de tempo selecionado para análise.
 */
interface KpiCardsProps {
  orders: Order[];
  period: "today" | "7days" | "30days";
}

/**
 * @component KpiCards
 * @description Renderiza cartões de métricas (Vendas, Pedidos, Ticket Médio, Conversão, PIX) com indicadores de variação percentual.
 * @param {KpiCardsProps} props - Propriedades do componente.
 */
const KpiCards = ({ orders, period }: KpiCardsProps) => {
  const now = new Date();
  const filterDate = new Date();
  
  // Define a data inicial do período atual
  if (period === "today") filterDate.setHours(0, 0, 0, 0);
  else if (period === "7days") filterDate.setDate(now.getDate() - 7);
  else filterDate.setDate(now.getDate() - 30);

  // Define a data inicial do período anterior para comparação
  const prevFilterDate = new Date(filterDate);
  if (period === "today") prevFilterDate.setDate(prevFilterDate.getDate() - 1);
  else if (period === "7days") prevFilterDate.setDate(prevFilterDate.getDate() - 7);
  else prevFilterDate.setDate(prevFilterDate.getDate() - 30);

  // Filtra pedidos dos dois períodos
  const current = orders.filter(o => new Date(o.created_at) >= filterDate);
  const previous = orders.filter(o => {
    const d = new Date(o.created_at);
    return d >= prevFilterDate && d < filterDate;
  });

  // Cálculos de Volume de Vendas (Receita)
  const totalRevenue = current.filter(o => o.status === "paid").reduce((s, o) => s + o.amount, 0) / 100;
  const prevRevenue = previous.filter(o => o.status === "paid").reduce((s, o) => s + o.amount, 0) / 100;

  // Cálculos de Total de Pedidos
  const totalSales = current.length;
  const prevSales = previous.length;

  // Cálculos de Ticket Médio
  const paidOrders = current.filter(o => o.status === "paid").length;
  const ticketMedio = paidOrders > 0 ? totalRevenue / paidOrders : 0;

  // Cálculos de Conversão PIX
  const pixGenerated = current.filter(o => o.status === "pix_generated" || o.status === "paid").length;
  const pixPaid = paidOrders;
  const conversionRate = pixGenerated > 0 ? (pixPaid / pixGenerated) * 100 : 0;

  const prevPixGenerated = previous.filter(o => o.status === "pix_generated" || o.status === "paid").length;
  const prevPixPaid = previous.filter(o => o.status === "paid").length;
  const prevConversion = prevPixGenerated > 0 ? (prevPixPaid / prevPixGenerated) * 100 : 0;

  /**
   * Função auxiliar para calcular a variação percentual entre dois valores.
   */
  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  // Definição dos cartões de KPI
  const cards = [
    {
      label: "Volume de Vendas",
      value: `R$ ${totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      change: calcChange(totalRevenue, prevRevenue),
      icon: DollarSign,
      gradient: "from-[hsl(145,70%,50%)] to-[hsl(145,60%,35%)]",
      iconBg: "hsl(145,70%,12%)",
      iconColor: "hsl(145,70%,50%)",
    },
    {
      label: "Total de Pedidos",
      value: totalSales.toString(),
      change: calcChange(totalSales, prevSales),
      icon: ShoppingCart,
      gradient: "from-[hsl(210,100%,65%)] to-[hsl(210,80%,45%)]",
      iconBg: "hsl(210,100%,12%)",
      iconColor: "hsl(210,100%,65%)",
    },
    {
      label: "Ticket Médio",
      value: `R$ ${ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      change: 0,
      icon: BarChart3,
      gradient: "from-[hsl(280,80%,65%)] to-[hsl(280,60%,40%)]",
      iconBg: "hsl(280,80%,12%)",
      iconColor: "hsl(280,80%,65%)",
    },
    {
      label: "Conversão PIX",
      value: `${conversionRate.toFixed(1)}%`,
      change: calcChange(conversionRate, prevConversion),
      icon: Target,
      gradient: "from-[hsl(45,100%,60%)] to-[hsl(45,80%,40%)]",
      iconBg: "hsl(45,100%,10%)",
      iconColor: "hsl(45,100%,60%)",
    },
    {
      label: "PIX Gerados",
      value: pixGenerated.toString(),
      change: calcChange(pixGenerated, prevPixGenerated),
      icon: CreditCard,
      gradient: "from-[hsl(14,100%,55%)] to-[hsl(14,80%,38%)]",
      iconBg: "hsl(14,100%,10%)",
      iconColor: "hsl(14,100%,55%)",
    },
    {
      label: "PIX Pagos",
      value: pixPaid.toString(),
      change: calcChange(pixPaid, prevPixPaid),
      icon: CheckCircle,
      gradient: "from-[hsl(145,70%,50%)] to-[hsl(160,60%,35%)]",
      iconBg: "hsl(145,70%,12%)",
      iconColor: "hsl(145,70%,50%)",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-4 hover:border-[hsl(220,15%,22%)] transition-all duration-300 overflow-hidden"
        >
          {/* Brilho sutil no hover */}
          <div
            className={`absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 bg-gradient-to-br ${card.gradient}`}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: card.iconBg }}
              >
                <card.icon className="w-4 h-4" style={{ color: card.iconColor }} />
              </div>
              {card.change !== 0 && (
                <div
                  className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    card.change > 0
                      ? "text-[hsl(145,70%,50%)] bg-[hsl(145,70%,12%)]"
                      : "text-[hsl(0,84%,60%)] bg-[hsl(0,50%,12%)]"
                  }`}
                >
                  {card.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {Math.abs(card.change).toFixed(0)}%
                </div>
              )}
            </div>
            <p className="text-lg font-bold text-white leading-tight tracking-tight">{card.value}</p>
            <p className="text-[10px] text-[hsl(220,10%,45%)] mt-1.5 uppercase tracking-wider font-medium">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
