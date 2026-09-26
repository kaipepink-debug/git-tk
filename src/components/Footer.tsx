import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Componente de rodapé global do site.
 * Exibe informações institucionais, links de políticas, suporte e selos de segurança.
 * Busca dados da empresa (CNPJ, Endereço, etc.) dinamicamente das configurações do site.
 */
const Footer = () => {
  const [info, setInfo] = useState({
    company_name: "MONSTER MOBILIDADE LTDA",
    cnpj: "64.482.958/0001-00",
    contact_email: "monstereletric@gmail.com",
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
    <footer className="bg-background border-t border-border px-4 py-8">
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Seção Institucional */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Institucional</h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li><Link to="/sobre-nos" className="hover:text-foreground transition-colors">Sobre Nós</Link></li>
            <li><Link to="/quem-somos" className="hover:text-foreground transition-colors">Quem Somos</Link></li>
            <li>CNPJ: {info.cnpj}</li>
            <li>{info.contact_email}</li>
            <li>{info.contact_phone}</li>
            {info.company_address && <li>{info.company_address}</li>}
          </ul>
        </div>

        {/* Seção de Políticas Legais */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Políticas</h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li><Link to="/politica-privacidade" className="hover:text-foreground transition-colors">Política de Privacidade</Link></li>
            <li><Link to="/termos-condicoes" className="hover:text-foreground transition-colors">Termos e Condições</Link></li>
            <li><Link to="/politica-trocas" className="hover:text-foreground transition-colors">Política de Trocas e Devoluções</Link></li>
            <li><Link to="/politica-reembolso" className="hover:text-foreground transition-colors">Política de Reembolso</Link></li>
            <li><Link to="/politica-envio" className="hover:text-foreground transition-colors">Política de Envio</Link></li>
            <li><Link to="/politica-cookies" className="hover:text-foreground transition-colors">Política de Cookies</Link></li>
          </ul>
        </div>

        {/* Seção de Suporte ao Cliente */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Suporte</h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li><Link to="/central-atendimento" className="hover:text-foreground transition-colors">Central de Atendimento</Link></li>
            <li><Link to="/prazo-entrega" className="hover:text-foreground transition-colors">Prazo de Entrega</Link></li>
            <li><Link to="/rastreamento-pedido" className="hover:text-foreground transition-colors">Rastreamento de Pedido</Link></li>
            <li>Seg a Sex — 9h às 18h</li>
          </ul>
        </div>

        {/* Seção de Segurança e Confiança */}
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">Segurança e Confiança</h3>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li>Compra Segura</li>
            <li>Proteção ao Cliente</li>
            <li>Pagamento Seguro</li>
            <li>Criptografia SSL</li>
            <li>LGPD</li>
          </ul>
        </div>
      </div>

      {/* Rodapé inferior com informações legais compactas */}
      <div className="border-t border-border pt-4 text-center space-y-1">
        <p className="text-[10px] text-muted-foreground">
          Seus dados são protegidos com criptografia SSL. Estamos em conformidade com a LGPD.
        </p>
        <p className="text-xs font-semibold text-foreground mt-2">{info.company_name}</p>
        <p className="text-[10px] text-muted-foreground">CNPJ: {info.cnpj}</p>
      </div>
    </footer>
  );
};

export default Footer;
