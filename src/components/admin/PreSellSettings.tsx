import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, SlidersHorizontal, Eye, EyeOff } from "lucide-react";

const PRESELL_KEYS = ["presell_enabled", "presell_button_text", "presell_instruction_text", "presell_button_color"] as const;

const PreSellSettings = () => {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data: rows } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", [...PRESELL_KEYS]);
      if (rows) {
        const map: Record<string, string> = {};
        rows.forEach(r => { map[r.key] = r.value; });
        setData(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    const promises = PRESELL_KEYS.map(key =>
      supabase.from("site_settings").upsert({ key, value: data[key] || "" }, { onConflict: "key" })
    );
    await Promise.all(promises);
    toast({ title: "Configurações da Pre-Sell salvas!" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isEnabled = data.presell_enabled === "true";

  const toggleEnabled = () => {
    setData(prev => ({ ...prev, presell_enabled: prev.presell_enabled === "true" ? "false" : "true" }));
  };

  if (loading) {
    return (
      <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[hsl(220,10%,40%)]" />
      </div>
    );
  }

  return (
    <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[hsl(220,15%,14%)] flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[hsl(340,80%,10%)] flex items-center justify-center">
          <SlidersHorizontal className="w-4 h-4 text-[hsl(340,80%,60%)]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Pre-Sell / Bloqueio</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)]">Tela de desbloqueio exibida antes do produto</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)]">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <Eye className="w-4 h-4 text-emerald-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-[hsl(220,10%,40%)]" />
            )}
            <div>
              <p className="text-[11px] font-medium text-white">Pre-Sell {isEnabled ? "Ativa" : "Desativada"}</p>
              <p className="text-[9px] text-[hsl(220,10%,40%)]">
                {isEnabled ? "Visitantes precisam deslizar para ver o produto" : "Produto visível diretamente"}
              </p>
            </div>
          </div>
          <button
            onClick={toggleEnabled}
            className={`relative w-11 h-6 rounded-full transition-colors ${isEnabled ? "bg-emerald-500" : "bg-[hsl(220,15%,20%)]"}`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isEnabled ? "translate-x-5.5 left-auto right-0.5" : "left-0.5"}`}
              style={{ transform: isEnabled ? "translateX(0)" : "translateX(0)", left: isEnabled ? "auto" : "2px", right: isEnabled ? "2px" : "auto" }}
            />
          </button>
        </div>

        {/* Button text */}
        <div>
          <label className="text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium">
            Texto do Botão
          </label>
          <input
            type="text"
            value={data.presell_button_text || ""}
            onChange={e => setData(prev => ({ ...prev, presell_button_text: e.target.value }))}
            placeholder="Ex: Deslize para obter a oferta →"
            className="w-full px-3 py-2.5 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)] transition-colors"
          />
        </div>

        {/* Instruction text */}
        <div>
          <label className="text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium">
            Texto de Instrução
          </label>
          <input
            type="text"
            value={data.presell_instruction_text || ""}
            onChange={e => setData(prev => ({ ...prev, presell_instruction_text: e.target.value }))}
            placeholder="Ex: Arraste o botão para a direita"
            className="w-full px-3 py-2.5 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)] transition-colors"
          />
        </div>

        {/* Button color */}
        <div>
          <label className="text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium">
            Cor do Botão
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={data.presell_button_color || "#FE2C55"}
              onChange={e => setData(prev => ({ ...prev, presell_button_color: e.target.value }))}
              className="w-10 h-10 rounded-lg border border-[hsl(220,15%,18%)] cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={data.presell_button_color || "#FE2C55"}
              onChange={e => setData(prev => ({ ...prev, presell_button_color: e.target.value }))}
              className="flex-1 px-3 py-2.5 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)] transition-colors font-mono"
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium">
            Pré-visualização
          </label>
          <div className="p-4 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)]">
            <div
              className="relative w-full h-12 rounded-full overflow-hidden"
              style={{ background: data.presell_button_color || "#FE2C55" }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white/90">
                {data.presell_button_text || "Deslize para obter a oferta →"}
              </span>
              <div className="absolute top-1 left-1 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow">
                <span style={{ color: data.presell_button_color || "#FE2C55" }} className="text-sm">›</span>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-center text-[hsl(220,10%,40%)]">
              {data.presell_instruction_text || "Arraste o botão para a direita para liberar a oferta"}
            </p>
          </div>
        </div>

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[hsl(14,100%,55%)] to-[hsl(14,100%,45%)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[hsl(14,100%,30%)]/15"
        >
          {saving ? "Salvando..." : saved ? (
            <span className="flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Salvo
            </span>
          ) : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
};

export default PreSellSettings;
