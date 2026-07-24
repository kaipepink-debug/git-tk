import { LogOut, Volume2, VolumeX, Activity, Shield, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface DashboardTopBarProps {
  activeGateway: string;
  liveCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout: () => void;
}

const DashboardTopBar = ({
  activeGateway,
  liveCount,
  soundEnabled,
  onToggleSound,
  onLogout,
}: DashboardTopBarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-gradient-to-r from-[hsl(220,25%,8%)] via-[hsl(220,20%,10%)] to-[hsl(220,25%,8%)] border-b border-[hsl(220,15%,15%)] px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl">
      <div className="flex items-center gap-5">
        {/* Logo / Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(14,100%,55%)] to-[hsl(14,100%,42%)] flex items-center justify-center shadow-lg shadow-[hsl(14,100%,30%)]/25">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">Escala</h1>
            <p className="text-[9px] text-[hsl(220,10%,40%)] leading-none mt-0.5">Painel Administrativo</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-7 bg-[hsl(220,15%,18%)]" />

        {/* Gateway status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,15%,18%)]">
          <Shield className="w-3.5 h-3.5 text-[hsl(220,10%,45%)]" />
          <span className="text-[10px] text-[hsl(220,10%,50%)]">Gateway:</span>
          <span className="text-[10px] font-semibold text-white">{activeGateway || "—"}</span>
          {activeGateway && (
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(145,70%,50%)] animate-pulse" />
          )}
        </div>

        {/* Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-[hsl(220,10%,40%)]">
          <Clock className="w-3 h-3" />
          <span className="text-[10px] font-mono tabular-nums">
            {time.toLocaleTimeString("pt-BR")}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Live visitors badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(145,80%,8%)] border border-[hsl(145,50%,20%)] mr-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(145,70%,50%)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(145,70%,50%)]" />
          </span>
          <span className="text-[11px] font-bold text-[hsl(145,70%,55%)] tabular-nums">{liveCount}</span>
          <span className="text-[10px] text-[hsl(145,40%,40%)] hidden sm:inline">online</span>
        </div>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-lg hover:bg-[hsl(220,15%,15%)] transition-all text-[hsl(220,10%,45%)] hover:text-white"
          title={soundEnabled ? "Desativar alertas sonoros" : "Ativar alertas sonoros"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[hsl(220,15%,18%)]" />

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 rounded-lg hover:bg-[hsl(0,50%,12%)] transition-all text-[hsl(220,10%,45%)] hover:text-[hsl(0,80%,60%)]"
          title="Sair"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DashboardTopBar;
