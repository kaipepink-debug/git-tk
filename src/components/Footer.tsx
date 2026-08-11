import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Componente de rodapé global do site.
 * Exibe a marca, links institucionais, políticas, suporte e selos de segurança.
 * Busca dados da empresa (CNPJ, Endereço, etc.) dinamicamente das configurações do site.
 */
const Footer = () => {
  const [info, setInfo] = useState({
    company_name: "JP VARIEDADES LTDA",
    cnpj: "64.482.958/0001-00",
    contact_email: "contato@JPvariedadesltda.com.br",
    contact_phone: "(89) 98102-5918",
    company_address: "",
  });

  // Carrega as informações da empresa do Supabase
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["company_name", "cnpj", "contact_email", "contact_phone", "company_address"]);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value; });
        setInfo(prev => ({ ...prev, ...map }));
      }
    };
    load();
  }, []);

  return (
    <footer className="bg-ink text-ink-foreground px-4 py-10 mt-2">
      <div className="max-w-6xl mx-auto">
        <span className="font-extrabold italic text-2xl tracking-tighter block mb-8" style={{ fontFamily: "Archivo, system-ui, sans-serif" }}>
          MINAS ESCADAS
        </span>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Seção Institucional */}
          <div>
            <h3 className="text-sm font-bold mb-3">Institucional</h3>
            <ul className="space-y-1.5 text-xs text-ink-foreground/60">
              <li><Link to="/sobre-nos" className="hover:text-ink-foreground transition-colors">Sobre Nós</Link></li>
              <li><Link to="/quem-somos" className="hover:text-ink-foreground transition-colors">Quem Somos</Link></li>
              <li>CNPJ: {info.cnpj}</li>
              <li>{info.contact_email}</li>
              <li>{info.contact_phone}</li>
              {info.company_address && <li>{info.company_address}</li>}
            </ul>
          </div>

          {/* Seção de Políticas Legais */}
          <div>
            <h3 className="text-sm font-bold mb-3">Políticas</h3>
            <ul className="space-y-1.5 text-xs text-ink-foreground/60">
              <li><Link to="/politica-privacidade" className="hover:text-ink-foreground transition-colors">Política de Privacidade</Link></li>
              <li><Link to="/termos-condicoes" className="hover:text-ink-foreground transition-colors">Termos e Condições</Link></li>
              <li><Link to="/politica-trocas" className="hover:text-ink-foreground transition-colors">Política de Trocas e Devoluções</Link></li>
              <li><Link to="/politica-reembolso" className="hover:text-ink-foreground transition-colors">Política de Reembolso</Link></li>
              <li><Link to="/politica-envio" className="hover:text-ink-foreground transition-colors">Política de Envio</Link></li>
              <li><Link to="/politica-cookies" className="hover:text-ink-foreground transition-colors">Política de Cookies</Link></li>
            </ul>
          </div>

          {/* Seção de Suporte ao Cliente */}
          <div>
            <h3 className="text-sm font-bold mb-3">Suporte</h3>
            <ul className="space-y-1.5 text-xs text-ink-foreground/60">
              <li><Link to="/central-atendimento" className="hover:text-ink-foreground transition-colors">Central de Atendimento</Link></li>
              <li><Link to="/prazo-entrega" className="hover:text-ink-foreground transition-colors">Prazo de Entrega</Link></li>
              <li><Link to="/rastreamento-pedido" className="hover:text-ink-foreground transition-colors">Rastreamento de Pedido</Link></li>
              <li>Seg a Sex — 9h às 18h</li>
            </ul>
          </div>

          {/* Seção de Segurança e Confiança */}
          <div>
            <h3 className="text-sm font-bold mb-3">Segurança e Confiança</h3>
            <ul className="space-y-1.5 text-xs text-ink-foreground/60">
              <li>Compra Segura</li>
              <li>Proteção ao Cliente</li>
              <li>Pagamento Seguro</li>
              <li>Criptografia SSL</li>
              <li>LGPD</li>
            </ul>
          </div>
        </div>

        {/* Rodapé inferior com informações legais compactas */}
        <div className="border-t border-ink-foreground/10 pt-4 text-center space-y-1">
          <p className="text-[10px] text-ink-foreground/50">
            Seus dados são protegidos com criptografia SSL. Estamos em conformidade com a LGPD.
          </p>
          <p className="text-xs font-semibold mt-2">{info.company_name}</p>
          <p className="text-[10px] text-ink-foreground/50">CNPJ: {info.cnpj}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
