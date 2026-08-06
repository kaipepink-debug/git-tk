/**
 * Componente: CheckoutHeader
 * Propósito: Cabeçalho compartilhado das páginas do fluxo de checkout (Carrinho,
 * Finalizar Compra, Adicionar Endereço, Pagamento Pix), com faixa de anúncio,
 * wordmark da loja e um indicador de progresso em 3 etapas.
 */

import { ChevronLeft, ShieldCheck } from "lucide-react";

/** Etapas possíveis do funil de checkout. */
export type CheckoutStep = "carrinho" | "dados" | "pagamento";

interface CheckoutHeaderProps {
  /** Ação disparada ao clicar na seta de voltar (mantém a navegação original da página). */
  onBack: () => void;
  /** Etapa atual, usada para destacar o passo correspondente em verde (primary). */
  step: CheckoutStep;
}

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "carrinho", label: "Carrinho" },
  { key: "dados", label: "Dados" },
  { key: "pagamento", label: "Pagamento" },
];

/**
 * Cabeçalho visual reutilizável do checkout: faixa preta de anúncio, barra preta
 * com wordmark "ZYRO" e seta de voltar, e indicador de progresso de 3 etapas.
 */
const CheckoutHeader = ({ onBack, step }: CheckoutHeaderProps) => {
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="sticky top-0 z-50">
      {/* Faixa de anúncio */}
      <div className="bg-ink text-ink-foreground/80 text-center text-[10px] sm:text-xs tracking-widest uppercase py-1.5 px-2">
        Compra 100% segura • Frete grátis
      </div>

      {/* Barra com wordmark e voltar */}
      <div className="bg-ink text-ink-foreground relative flex items-center justify-center px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Voltar"
          className="absolute left-4 p-1 -m-1"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-extrabold tracking-tight text-lg" style={{ fontFamily: "'Archivo', system-ui, sans-serif" }}>
          CHIQUEB
        </span>
      </div>

      {/* Indicador de progresso */}
      <div className="bg-background border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-2 sm:gap-4">
          {STEPS.map((s, i) => {
            const isActive = i === currentIndex;
            const isDone = i < currentIndex;
            return (
              <div key={s.key} className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                      isActive || isDone
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-[11px] uppercase tracking-widest font-semibold ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="w-4 sm:w-8 h-px bg-border" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CheckoutHeader;
