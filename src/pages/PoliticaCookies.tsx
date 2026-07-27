/**
 * Rota: /politica-cookies
 * Propósito: Página informativa sobre o uso de cookies no site, em conformidade com leis
 * de proteção de dados (LGPD).
 */

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Componente da página Política de Cookies.
 */
const PoliticaCookies = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Política de Cookies</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>Este site utiliza cookies para melhorar sua experiência de navegação.</p>

        <h2 className="text-base font-semibold text-foreground">1. O que são Cookies?</h2>
        <p>Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita um site. Eles permitem que o site funcione corretamente e melhore sua experiência.</p>

        <h2 className="text-base font-semibold text-foreground">2. Tipos de Cookies Utilizados</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-foreground">Essenciais:</strong> necessários para o funcionamento do site (carrinho de compras, sessão).</li>
          <li><strong className="text-foreground">Analíticos:</strong> nos ajudam a entender como os visitantes usam o site.</li>
          <li><strong className="text-foreground">Marketing:</strong> utilizados para exibir anúncios relevantes.</li>
        </ul>

        <h2 className="text-base font-semibold text-foreground">3. Como Gerenciar Cookies</h2>
        <p>Você pode gerenciar ou desativar cookies nas configurações do seu navegador. Note que desativar cookies essenciais pode afetar o funcionamento do site.</p>

        <h2 className="text-base font-semibold text-foreground">4. Consentimento</h2>
        <p>Ao continuar navegando em nosso site, você consente com o uso de cookies conforme descrito nesta política.</p>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Última atualização: março de 2026. JP VARIEDADES LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default PoliticaCookies;
