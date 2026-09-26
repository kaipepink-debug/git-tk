/**
 * @file PrazoEntrega.tsx
 * @description Página informativa sobre os prazos estimados de entrega por região.
 */

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Componente que renderiza a tabela de prazos de entrega.
 * 
 * @returns {JSX.Element} A página com a tabela de prazos e observações de entrega.
 * @description Exibe uma estimativa de dias úteis para cada região do Brasil.
 */
const PrazoEntrega = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Prazo de Entrega</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>Confira abaixo os prazos estimados de entrega após a confirmação do pagamento:</p>

        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Região</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Prazo Estimado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Sudeste</td>
                <td className="px-3 py-2">5 a 10 dias úteis</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Sul</td>
                <td className="px-3 py-2">7 a 12 dias úteis</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Centro-Oeste</td>
                <td className="px-3 py-2">8 a 14 dias úteis</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Nordeste</td>
                <td className="px-3 py-2">10 a 16 dias úteis</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2">Norte</td>
                <td className="px-3 py-2">12 a 20 dias úteis</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="text-base font-semibold text-foreground">Observações</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>O prazo inicia após a confirmação do pagamento.</li>
          <li>Pedidos realizados em feriados ou fins de semana serão processados no próximo dia útil.</li>
          <li>Em períodos de alta demanda, o prazo pode sofrer pequenas variações.</li>
          <li>Regiões de difícil acesso podem ter prazos maiores.</li>
        </ul>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          MONSTER MOBILIDADE LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default PrazoEntrega;
