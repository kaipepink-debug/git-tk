/**
 * @file PoliticaTrocas.tsx
 * @description Página que detalha as políticas de trocas e devoluções da loja.
 */

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Componente que exibe a política de trocas e devoluções.
 * 
 * @returns {JSX.Element} A interface de usuário para a página de trocas.
 * @description Fornece informações sobre o direito de arrependimento, produtos com defeito e prazos de análise.
 */
const PoliticaTrocas = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Política de Trocas e Devoluções</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>A JP Variedades LTDA segue o Código de Defesa do Consumidor (CDC) em relação a trocas e devoluções.</p>

        <h2 className="text-base font-semibold text-foreground">1. Direito de Arrependimento</h2>
        <p>Você pode desistir da compra em até 7 dias corridos após o recebimento do produto, conforme o artigo 49 do CDC. O produto deve estar em sua embalagem original, sem sinais de uso.</p>

        <h2 className="text-base font-semibold text-foreground">2. Produtos com Defeito</h2>
        <p>Caso receba um produto com defeito, entre em contato conosco em até 30 dias após o recebimento. Envie fotos do defeito para agilizar a análise.</p>

        <h2 className="text-base font-semibold text-foreground">3. Como Solicitar</h2>
        <p>Entre em contato pelo e-mail monstereletric@gmail.com ou pelo telefone (89) 98102-5918, informando o número do pedido e o motivo da troca/devolução.</p>

        <h2 className="text-base font-semibold text-foreground">4. Prazo de Análise</h2>
        <p>Após o recebimento do produto devolvido, a análise será realizada em até 5 dias úteis. Você será notificado por e-mail sobre o resultado.</p>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Última atualização: março de 2026. MONSTER MOBILIDADE LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default PoliticaTrocas;
