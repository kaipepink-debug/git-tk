import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Eye, EyeOff, Zap, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GatewayRow {
  id: string;
  gateway_name: string;
  api_token: string;
  product_id: string;
  is_active: boolean;
}

const gatewayMeta: Record<string, { color: string; description: string; icon: string }> = {
  SigmaPay: { color: "hsl(210,100%,65%)", description: "api.sigmapay.com.br", icon: "Σ" },
  GoatPay: { color: "hsl(145,70%,50%)", description: "api.goatpayments.com.br", icon: "G" },
  ZeroOnePay: { color: "hsl(45,100%,60%)", description: "api.zeroonepay.com.br", icon: "01" },
  PayEvo: { color: "hsl(280,80%,65%)", description: "payevov2.readme.io", icon: "PE" },
  Adqui: { color: "hsl(14,100%,55%)", description: "api.sigmapay.com.br", icon: "AQ" },
  SealPay: { color: "hsl(195,90%,50%)", description: "abacate-5eo1.onrender.com", icon: "SP" },
  ZenixPay: { color: "hsl(260,80%,60%)", description: "api.zenixpay.com.br", icon: "ZX" },
};

const GatewayIntegrations = ({ onGatewayChange }: { onGatewayChange?: (name: string) => void }) => {
  const [gateways, setGateways] = useState<GatewayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchGateways = async () => {
    const { data } = await supabase.from("gateway_settings").select("*").order("created_at");
    if (data) setGateways(data as GatewayRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchGateways(); }, []);

  const activateGateway = async (id: string) => {
    setSaving(id);
    // First deactivate ALL gateways
    await supabase.from("gateway_settings").update({ is_active: false }).neq("id", id);
    // Then activate only the selected one
    await supabase.from("gateway_settings").update({ is_active: true }).eq("id", id);
    toast({ title: "Gateway ativado com sucesso!" });
    await fetchGateways();
    const activated = gateways.find(g => g.id === id);
    if (activated) onGatewayChange?.(activated.gateway_name);
    setSaving(null);
  };

  const updateCredentials = async (id: string, field: "api_token" | "product_id", value: string) => {
    setGateways(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  };

  const saveCredentials = async (gw: GatewayRow) => {
    setSaving(gw.id);
    await supabase.from("gateway_settings").update({
      api_token: gw.api_token,
      product_id: gw.product_id,
    }).eq("id", gw.id);
    toast({ title: `Credenciais do ${gw.gateway_name} salvas!` });
    setSaving(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(220,10%,40%)]" />
          <p className="text-[10px] text-[hsl(220,10%,40%)]">Carregando gateways...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-[hsl(220,10%,45%)]" />
        <div>
          <h3 className="text-sm font-semibold text-white">Gateways de Pagamento</h3>
          <p className="text-[10px] text-[hsl(220,10%,40%)]">Configure e ative seus processadores de pagamento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map((gw) => {
          const meta = gatewayMeta[gw.gateway_name] || { color: "hsl(220,10%,55%)", description: "", icon: "?" };
          return (
            <div
              key={gw.id}
              className={`bg-[hsl(220,20%,11%)] border rounded-xl overflow-hidden transition-all duration-300 ${
                gw.is_active
                  ? "border-[hsl(145,60%,30%)] ring-1 ring-[hsl(145,70%,20%)]"
                  : "border-[hsl(220,15%,16%)] hover:border-[hsl(220,15%,22%)]"
              }`}
            >
              {/* Active indicator bar */}
              {gw.is_active && (
                <div className="h-0.5 bg-gradient-to-r from-transparent via-[hsl(145,70%,50%)] to-transparent" />
              )}

              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black tracking-tight"
                      style={{ background: `${meta.color}15`, color: meta.color, border: `1px solid ${meta.color}25` }}
                    >
                      {meta.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{gw.gateway_name}</h4>
                      <p className="text-[10px] text-[hsl(220,10%,40%)]">{meta.description}</p>
                    </div>
                  </div>
                  {gw.is_active ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-[hsl(145,70%,55%)] px-2.5 py-1 rounded-full bg-[hsl(145,50%,10%)] border border-[hsl(145,50%,20%)]">
                      <CheckCircle className="w-3 h-3" /> Ativo
                    </span>
                  ) : (
                    <button
                      onClick={() => activateGateway(gw.id)}
                      disabled={saving === gw.id}
                      className="text-[10px] font-semibold px-3.5 py-1.5 rounded-lg bg-[hsl(220,20%,16%)] border border-[hsl(220,15%,22%)] text-[hsl(220,10%,60%)] hover:text-white hover:bg-[hsl(220,20%,20%)] transition-all disabled:opacity-50"
                    >
                      {saving === gw.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Ativar"}
                    </button>
                  )}
                </div>

                {/* Credentials */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium">API Token</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type={showTokens[gw.id] ? "text" : "password"}
                        value={gw.api_token}
                        onChange={(e) => updateCredentials(gw.id, "api_token", e.target.value)}
                        placeholder="Insira o api_token"
                        className="flex-1 px-3 py-2.5 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)] transition-colors font-mono"
                      />
                      <button
                        onClick={() => setShowTokens(p => ({ ...p, [gw.id]: !p[gw.id] }))}
                        className="p-2.5 rounded-lg hover:bg-[hsl(220,15%,16%)] text-[hsl(220,10%,40%)] hover:text-[hsl(220,10%,60%)] transition-colors"
                      >
                        {showTokens[gw.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium">Product ID</label>
                    <input
                      type="text"
                      value={gw.product_id}
                      onChange={(e) => updateCredentials(gw.id, "product_id", e.target.value)}
                      placeholder="Insira o product_id"
                      className="w-full px-3 py-2.5 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)] transition-colors font-mono"
                    />
                  </div>
                  <button
                    onClick={() => saveCredentials(gw)}
                    disabled={saving === gw.id}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[hsl(14,100%,55%)] to-[hsl(14,100%,45%)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[hsl(14,100%,30%)]/15"
                  >
                    {saving === gw.id ? "Salvando..." : "Salvar Credenciais"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GatewayIntegrations;
