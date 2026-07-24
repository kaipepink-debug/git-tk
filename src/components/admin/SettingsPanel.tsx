import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, ExternalLink, CheckCircle, Building2, Loader2 } from "lucide-react";
import PreSellSettings from "./PreSellSettings";
import AntiDesvioSettings from "./AntiDesvioSettings";

interface SettingsPanelProps {
  tikTokPixelId: string;
  setTikTokPixelId: (v: string) => void;
}

const footerFields = [
  { key: "company_name", label: "Nome da Empresa", placeholder: "Ex: JP VARIEDADES LTDA" },
  { key: "cnpj", label: "CNPJ", placeholder: "Ex: 64.482.958/0001-00" },
  { key: "contact_email", label: "E-mail de Contato", placeholder: "Ex: contato@empresa.com.br" },
  { key: "contact_phone", label: "Telefone", placeholder: "Ex: (89) 98102-5918" },
  { key: "company_address", label: "Endereço", placeholder: "Ex: Rua Exemplo, 123 - Cidade/UF" },
] as const;

const SettingsPanel = ({ tikTokPixelId, setTikTokPixelId }: SettingsPanelProps) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [footerData, setFooterData] = useState<Record<string, string>>({});
  const [footerLoading, setFooterLoading] = useState(true);
  const [footerSaving, setFooterSaving] = useState(false);
  const [footerSaved, setFooterSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", footerFields.map(f => f.key));
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value; });
        setFooterData(map);
      }
      setFooterLoading(false);
    };
    load();
  }, []);

  const saveTikTok = async () => {
    setSaving(true);
    await supabase.from("site_settings").upsert({ key: "tiktok_pixel_id", value: tikTokPixelId }, { onConflict: "key" });
    toast({ title: "Pixel salvo com sucesso!" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const saveFooter = async () => {
    setFooterSaving(true);
    const promises = footerFields.map(f =>
      supabase.from("site_settings").upsert({ key: f.key, value: footerData[f.key] || "" }, { onConflict: "key" })
    );
    await Promise.all(promises);
    toast({ title: "Informações do rodapé salvas!" });
    setFooterSaving(false);
    setFooterSaved(true);
    setTimeout(() => setFooterSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-4">
      {/* Anti-Desvio */}
      <AntiDesvioSettings />

      {/* Pre-Sell */}
      <PreSellSettings />

      {/* Footer / Company Info */}
      <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[hsl(220,15%,14%)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[hsl(14,80%,10%)] flex items-center justify-center">
            <Building2 className="w-4 h-4 text-[hsl(14,100%,55%)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Informações da Empresa</h3>
            <p className="text-[10px] text-[hsl(220,10%,40%)]">Dados exibidos no rodapé do site</p>
          </div>
        </div>
        <div className="p-5 space-y-3">
          {footerLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-[hsl(220,10%,40%)]" />
            </div>
          ) : (
            <>
              {footerFields.map(f => (
                <div key={f.key}>
                  <label className="text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium">{f.label}</label>
                  <input
                    type="text"
                    value={footerData[f.key] || ""}
                    onChange={e => setFooterData(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)] transition-colors"
                  />
                </div>
              ))}
              <button
                onClick={saveFooter}
                disabled={footerSaving}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[hsl(14,100%,55%)] to-[hsl(14,100%,45%)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[hsl(14,100%,30%)]/15 mt-1"
              >
                {footerSaving ? "Salvando..." : footerSaved ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Salvo
                  </span>
                ) : "Salvar Informações"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* TikTok Pixel */}
      <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[hsl(220,15%,14%)] flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[hsl(280,80%,10%)] flex items-center justify-center">
            <Settings className="w-4 h-4 text-[hsl(280,80%,65%)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">TikTok Pixel</h3>
            <p className="text-[10px] text-[hsl(220,10%,40%)]">Rastreamento de conversões do TikTok Ads</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium">Pixel ID</label>
            <input
              type="text"
              value={tikTokPixelId}
              onChange={(e) => setTikTokPixelId(e.target.value)}
              placeholder="Ex: D6G44ARC77UFOU5DFV20"
              className="w-full px-3 py-2.5 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)] transition-colors font-mono"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveTikTok}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[hsl(14,100%,55%)] to-[hsl(14,100%,45%)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[hsl(14,100%,30%)]/15"
            >
              {saving ? "Salvando..." : saved ? (
                <span className="flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Salvo
                </span>
              ) : "Salvar Pixel"}
            </button>
            <a
              href="https://ads.tiktok.com/help/article/standard-events-parameters"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[hsl(220,20%,14%)] border border-[hsl(220,15%,20%)] text-[11px] text-[hsl(220,10%,55%)] hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Docs
            </a>
          </div>
        </div>
      </div>

      {/* System info */}
      <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Informações do Sistema</h3>
        <div className="space-y-2">
          {[
            ["Plataforma", "Lovable Cloud"],
            ["Versão", "2.0.0"],
            ["Ambiente", "Produção"],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-[hsl(220,15%,14%)] last:border-0">
              <span className="text-[11px] text-[hsl(220,10%,45%)]">{label}</span>
              <span className="text-[11px] font-medium text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
