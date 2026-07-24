import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { MousePointerClick, ScrollText, Eye, ArrowDownToLine } from "lucide-react";

interface AnalyticsEvent {
  id: string;
  event_type: string;
  page: string;
  element_tag: string | null;
  element_text: string | null;
  element_id: string | null;
  element_class: string | null;
  x_position: number | null;
  y_position: number | null;
  scroll_depth: number | null;
  created_at: string;
}

interface AnalyticsPanelProps {
  period: "today" | "7days" | "30days";
}

const AnalyticsPanel = ({ period }: AnalyticsPanelProps) => {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const now = new Date();
      let from: Date;
      if (period === "today") {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (period === "7days") {
        from = new Date(now.getTime() - 7 * 86400000);
      } else {
        from = new Date(now.getTime() - 30 * 86400000);
      }

      const { data } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", from.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000);

      setEvents((data as AnalyticsEvent[]) || []);
      setLoading(false);
    };
    fetchEvents();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-6 h-6 border-2 border-t-transparent border-[hsl(210,100%,65%)] rounded-full" />
          <p className="text-[10px] text-[hsl(220,10%,40%)]">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  const clicks = events.filter(e => e.event_type === "click");
  const scrolls = events.filter(e => e.event_type === "scroll");

  const clickMap: Record<string, { count: number; text: string; tag: string }> = {};
  clicks.forEach(c => {
    const key = c.element_text || c.element_id || c.element_tag || "unknown";
    const label = (c.element_text || "").slice(0, 40) || c.element_id || c.element_tag || "?";
    if (!clickMap[key]) clickMap[key] = { count: 0, text: label, tag: c.element_tag || "" };
    clickMap[key].count++;
  });
  const topClicks = Object.values(clickMap).sort((a, b) => b.count - a.count).slice(0, 12);

  const scrollDepths = [25, 50, 75, 100];
  const scrollData = scrollDepths.map(d => ({
    depth: `${d}%`,
    count: scrolls.filter(s => s.scroll_depth === d).length,
  }));

  const scrollColors = ["hsl(210,100%,65%)", "hsl(45,100%,60%)", "hsl(14,100%,55%)", "hsl(145,70%,50%)"];

  const summaryCards = [
    { label: "Total Cliques", value: clicks.length, icon: MousePointerClick, color: "hsl(14,100%,55%)", bg: "hsl(14,100%,10%)" },
    { label: "Eventos Scroll", value: scrolls.length, icon: ScrollText, color: "hsl(210,100%,65%)", bg: "hsl(210,100%,10%)" },
    { label: "Chegaram a 50%", value: scrolls.filter(s => s.scroll_depth === 50).length, icon: Eye, color: "hsl(45,100%,60%)", bg: "hsl(45,100%,10%)" },
    { label: "Chegaram a 100%", value: scrolls.filter(s => s.scroll_depth === 100).length, icon: ArrowDownToLine, color: "hsl(145,70%,50%)", bg: "hsl(145,70%,10%)" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[hsl(220,25%,10%)] border border-[hsl(220,15%,20%)] rounded-lg px-3 py-2 shadow-xl">
        <p className="text-[10px] text-[hsl(220,10%,50%)]">{label}</p>
        <p className="text-xs font-bold text-white">{payload[0].value} eventos</p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map(card => (
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
        {/* Top clicks */}
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Elementos Mais Clicados</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)] mb-4">Ranking de interações por elemento</p>
          {topClicks.length === 0 ? (
            <p className="text-xs text-[hsl(220,10%,35%)] py-8 text-center">Nenhum clique registrado</p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {topClicks.map((item, i) => {
                const maxCount = topClicks[0]?.count || 1;
                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] w-5 h-5 rounded flex items-center justify-center bg-[hsl(220,20%,16%)] text-[hsl(220,10%,50%)] font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(220,20%,16%)] text-[hsl(210,100%,65%)] font-mono shrink-0 uppercase">
                          {item.tag}
                        </span>
                        <span className="text-[11px] text-[hsl(220,10%,60%)] truncate">{item.text}</span>
                      </div>
                      <span className="text-xs font-bold text-white shrink-0 ml-2 tabular-nums">{item.count}</span>
                    </div>
                    <div className="h-1.5 bg-[hsl(220,20%,14%)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(item.count / maxCount) * 100}%`,
                          background: `linear-gradient(90deg, hsl(14,100%,55%), hsl(14,80%,45%))`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scroll depth */}
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Profundidade de Scroll</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)] mb-4">Quanto os visitantes rolam a página</p>
          {scrolls.length === 0 ? (
            <p className="text-xs text-[hsl(220,10%,35%)] py-8 text-center">Nenhum dado de scroll</p>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={scrollData} barCategoryGap="25%">
                  <XAxis dataKey="depth" tick={{ fill: "hsl(220,10%,50%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(220,10%,40%)", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {scrollData.map((_, i) => (
                      <Cell key={i} fill={scrollColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Scroll retention */}
              <div className="mt-4 pt-4 border-t border-[hsl(220,15%,14%)]">
                <p className="text-[10px] text-[hsl(220,10%,42%)] uppercase tracking-wider font-medium mb-2">Taxa de Retenção</p>
                <div className="flex items-center gap-3">
                  {scrollData.map((d, i) => {
                    const rate = scrollData[0].count > 0 ? ((d.count / scrollData[0].count) * 100).toFixed(0) : "0";
                    return (
                      <div key={d.depth} className="flex-1 text-center">
                        <p className="text-sm font-bold" style={{ color: scrollColors[i] }}>{rate}%</p>
                        <p className="text-[9px] text-[hsl(220,10%,40%)]">{d.depth}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
