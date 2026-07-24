import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, CheckCircle, Loader2, Activity } from "lucide-react";

const SETTING_KEYS = {
  enabled: "anti_desvio_enabled",
  targetRate: "anti_desvio_target_rate",
};

const AntiDesvioSettings = () => {
  const [enabled, setEnabled] = useState(false);
  const [targetRate, setTargetRate] = useState("30");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState<{ total: number; paid: number; rate: number; fakeCount: number } | null>(null);
  const { toast } = useToast();

  const loadSettings = useCallback(async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", Object.values(SETTING_KEYS));
    if (data) {
      data.forEach((r) => {
        if (r.key === SETTING_KEYS.enabled) setEnabled(r.value === "true");
        if (r.key === SETTING_KEYS.targetRate) setTargetRate(r.value || "30");
      });
    }
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    const { count: totalCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });
    const { count: paidCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid");
    const { count: fakeCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .like("customer_name", "% Silva");
    const total = totalCount || 0;
    const paid = paidCount || 0;
    const rate = total > 0 ? (paid / total) * 100 : 0;
    setStats({ total, paid, rate, fakeCount: fakeCount || 0 });
  }, []);

  useEffect(() => {
    loadSettings();
    loadStats();
  }, [loadSettings, loadStats]);

  const save = async () => {
    setSaving(true);
    const newEnabled = enabled;
    await Promise.all([
      supabase.from("site_settings").upsert({ key: SETTING_KEYS.enabled, value: String(newEnabled) }, { onConflict: "key" }),
      supabase.from("site_settings").upsert({ key: SETTING_KEYS.targetRate, value: targetRate }, { onConflict: "key" }),
    ]);
    toast({ title: newEnabled ? "Anti-desvio ativado!" : "Anti-desvio desativado!" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5 flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[hsl(220,10%,40%)]" />
      </div>
    );
  }

  return (
    <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[hsl(220,15%,14%)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[hsl(0,80%,10%)] flex items-center justify-center">
          <ShieldAlert className="w-4 h-4 text-[hsl(0,100%,55%)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Modo Anti-Desvio</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)]">
            Monitora e gera transações automaticamente a cada 5 min
          </p>
        </div>
        {enabled && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(0,100%,55%)]/10 border border-[hsl(0,100%,55%)]/20">
            <Activity className="w-3 h-3 text-[hsl(0,100%,55%)] animate-pulse" />
            <span className="text-[10px] font-medium text-[hsl(0,100%,55%)]">Ativo</span>
          </div>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Current stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: stats.total },
              { label: "Pagos", value: stats.paid },
              { label: "Taxa", value: `${stats.rate.toFixed(1)}%` },
              { label: "Fictícios", value: stats.fakeCount },
            ].map((s) => (
              <div key={s.label} className="bg-[hsl(220,20%,7%)] rounded-lg p-2.5 text-center">
                <p className="text-[9px] text-[hsl(220,10%,45%)] uppercase tracking-wider">{s.label}</p>
                <p className="text-base font-bold text-white mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-[11px] text-[hsl(220,10%,55%)] block">Ativar monitoramento automático</label>
            <p className="text-[9px] text-[hsl(220,10%,35%)]">Executa a cada 5 minutos automaticamente</p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              enabled ? "bg-[hsl(0,100%,55%)]" : "bg-[hsl(220,15%,20%)]"
            }`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Target rate */}
        <div>
          <label className="text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium">
            Taxa de conversão alvo (%)
          </label>
          <input
            type="number"
            min="5"
            max="95"
            value={targetRate}
            onChange={(e) => setTargetRate(e.target.value)}
            placeholder="30"
            className="w-full px-3 py-2.5 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(0,100%,55%)] transition-colors"
          />
          <p className="text-[10px] text-[hsl(220,10%,35%)] mt-1">
            O sistema manterá a taxa abaixo deste valor gerando pedidos com "Silva" no nome
          </p>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[hsl(0,100%,55%)] to-[hsl(0,100%,40%)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[hsl(0,100%,30%)]/15"
        >
          {saving ? "Salvando..." : saved ? (
            <span className="flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Salvo
            </span>
          ) : "Salvar Configurações"}
        </button>

        {/* Info */}
        <div className="bg-[hsl(220,20%,7%)] rounded-lg p-3 border border-[hsl(220,15%,14%)]">
          <p className="text-[10px] text-[hsl(220,10%,40%)] leading-relaxed">
            <strong className="text-[hsl(0,100%,55%)]">Como funciona:</strong> A cada 5 minutos o sistema verifica a taxa
            de conversão (pagos/total). Se estiver acima do alvo, gera até 10 pedidos fictícios por ciclo com status{" "}
            <strong className="text-white">pix_generated</strong> e sufixo{" "}
            <strong className="text-white">"Silva"</strong> no nome. O processo é gradual para parecer natural.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AntiDesvioSettings;
