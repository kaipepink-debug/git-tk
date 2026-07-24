import { Globe, Monitor, Smartphone, Clock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ActiveSession {
  id: string;
  session_id: string;
  page: string;
  last_seen_at: string;
  user_agent?: string | null;
}

interface VisitorsPanelProps {
  sessions: ActiveSession[];
}

const pageLabels: Record<string, string> = {
  "/": "Página Inicial",
  "/produto/presell": "Pre-Sell",
  "/produto": "Produto (após Pre-Sell)",
  "/finalizar-compra": "Checkout",
  "/carrinho": "Carrinho",
  "/adicionar-endereco": "Endereço",
  "/pagamento-pix": "Pagamento PIX",
};

const VisitorsPanel = ({ sessions }: VisitorsPanelProps) => {
  const [presellUnlocks, setPresellUnlocks] = useState(0);

  useEffect(() => {
    const fetchPresellUnlocks = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "presell_unlocked")
        .gte("created_at", today.toISOString());
      setPresellUnlocks(count || 0);
    };
    fetchPresellUnlocks();
    const interval = setInterval(fetchPresellUnlocks, 15000);
    return () => clearInterval(interval);
  }, []);

  const pageGroups = sessions.reduce((acc, s) => {
    acc[s.page] = (acc[s.page] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(pageGroups), 1);

  const mobileCount = sessions.filter(s => /mobile|android|iphone/i.test(s.user_agent || "")).length;
  const desktopCount = sessions.length - mobileCount;

  const getTimeSince = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 10) return "agora";
    if (diff < 60) return `${diff}s atrás`;
    return `${Math.floor(diff / 60)}m atrás`;
  };

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(145,70%,10%)] flex items-center justify-center">
            <Globe className="w-5 h-5 text-[hsl(145,70%,50%)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{sessions.length}</p>
            <p className="text-[10px] text-[hsl(220,10%,45%)] uppercase tracking-wider">Online Agora</p>
          </div>
        </div>
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(210,100%,10%)] flex items-center justify-center">
            <Monitor className="w-5 h-5 text-[hsl(210,100%,65%)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{desktopCount}</p>
            <p className="text-[10px] text-[hsl(220,10%,45%)] uppercase tracking-wider">Desktop</p>
          </div>
        </div>
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(280,80%,10%)] flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-[hsl(280,80%,65%)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{mobileCount}</p>
            <p className="text-[10px] text-[hsl(220,10%,45%)] uppercase tracking-wider">Mobile</p>
          </div>
        </div>
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[hsl(14,100%,10%)] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[hsl(14,100%,55%)]" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{presellUnlocks}</p>
            <p className="text-[10px] text-[hsl(220,10%,45%)] uppercase tracking-wider">Pre-Sell Hoje</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pages breakdown */}
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Visitantes por Página</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)] mb-4">Distribuição em tempo real</p>
          {Object.keys(pageGroups).length === 0 ? (
            <p className="text-xs text-[hsl(220,10%,35%)] py-8 text-center">Nenhum visitante online</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(pageGroups)
                .sort((a, b) => b[1] - a[1])
                .map(([page, count]) => (
                  <div key={page}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-medium text-[hsl(220,10%,65%)]">{pageLabels[page] || page}</span>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(145,70%,50%)] opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[hsl(145,70%,50%)]" />
                        </span>
                        <span className="text-xs font-bold text-white tabular-nums">{count}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-[hsl(220,20%,14%)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(count / maxCount) * 100}%`,
                          background: "linear-gradient(90deg, hsl(210,100%,65%), hsl(145,70%,50%))",
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Sessions list */}
        <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Sessões Ativas</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)] mb-4">{sessions.length} sessões em andamento</p>
          <div className="space-y-0.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
            {sessions.length === 0 ? (
              <p className="text-xs text-[hsl(220,10%,35%)] py-8 text-center">Nenhuma sessão ativa</p>
            ) : sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[hsl(220,20%,14%)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(145,70%,50%)] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(145,70%,50%)]" />
                  </span>
                  <div>
                    <p className="text-[11px] font-medium text-[hsl(220,10%,70%)]">{pageLabels[s.page] || s.page}</p>
                    <p className="text-[9px] text-[hsl(220,10%,30%)] font-mono">{s.session_id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[hsl(220,10%,35%)]">
                  <Clock className="w-3 h-3" />
                  <span className="text-[9px]">{getTimeSince(s.last_seen_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorsPanel;
