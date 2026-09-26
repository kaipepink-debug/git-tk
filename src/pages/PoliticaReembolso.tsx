/**
 * @file PoliticaReembolso.tsx
 * @description Página que exibe a política de reembolso da JP Variedades LTDA.
 */

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Componente funcional que renderiza a página de Política de Reembolso.
 * 
 * @returns {JSX.Element} O elemento JSX da página de Política de Reembolso.
 * @description Apresenta as condições, prazos e procedimentos para solicitação de reembolso.
 */
const PoliticaReembolso = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Política de Reembolso</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>A JP Variedades LTDA garante o reembolso conforme as condições abaixo.</p>

        <h2 className="text-base font-semibold text-foreground">1. Condições para Reembolso</h2>
        <p>O reembolso será realizado nos seguintes casos: desistência dentro do prazo de 7 dias (direito de arrependimento), produto com defeito confirmado ou produto não entregue.</p>

        <h2 className="text-base font-semibold text-foreground">2. Prazo de Reembolso</h2>
        <p>Após a aprovação da solicitação, o reembolso será processado em até 10 dias úteis, via mesma forma de pagamento utilizada na compra ou por transferência bancária.</p>

        <h2 className="text-base font-semibold text-foreground">3. Como Solicitar</h2>
        <p>Envie sua solicitação para monstereletric@gmail.com com o número do pedido e seus dados bancários para transferência.</p>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Última atualização: março de 2026. MONSTER MOBILIDADE LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default PoliticaReembolso;
