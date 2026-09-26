/**
 * Rota: /central-atendimento
 * Propósito: Oferece informações de contato e suporte ao cliente, incluindo e-mail,
 * WhatsApp, horário de atendimento e links para dúvidas frequentes.
 */

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Componente da página de Central de Atendimento.
 * Apresenta os canais oficiais de suporte da loja.
 */
const CentralAtendimento = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header com botão de retorno */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Central de Atendimento</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>Estamos aqui para ajudar! Entre em contato conosco pelos canais abaixo:</p>

        <h2 className="text-base font-semibold text-foreground">E-mail</h2>
        <p>monstereletric@gmail.com</p>

        <h2 className="text-base font-semibold text-foreground">Telefone / WhatsApp</h2>
        <p>(89) 98102-5918</p>

        <h2 className="text-base font-semibold text-foreground">Horário de Atendimento</h2>
        <p>Segunda a Sexta — 9h às 18h</p>

        <h2 className="text-base font-semibold text-foreground">Dúvidas Frequentes</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Como acompanho meu pedido? Acesse a página de Rastreamento de Pedido.</li>
          <li>Qual o prazo de entrega? Consulte a página de Prazo de Entrega.</li>
          <li>Como solicito troca ou devolução? Consulte nossa Política de Trocas e Devoluções.</li>
          <li>Como solicito reembolso? Consulte nossa Política de Reembolso.</li>
        </ul>

        {/* Informações corporativas */}
        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          MONSTER MOBILIDADE LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default CentralAtendimento;
