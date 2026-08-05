/**
 * Componente: CheckoutTrustRow
 * Propósito: Linha de selos de confiança exibida no rodapé das páginas de checkout.
 */
import { ShieldCheck, Truck, BadgeCheck } from "lucide-react";

const CheckoutTrustRow = () => (
  <div className="max-w-2xl mx-auto grid grid-cols-3 gap-2 px-4 py-6 text-center">
    <div className="flex flex-col items-center gap-1.5">
      <ShieldCheck className="w-5 h-5 text-primary" />
      <span className="text-[11px] text-muted-foreground">Pagamento seguro</span>
    </div>
    <div className="flex flex-col items-center gap-1.5">
      <Truck className="w-5 h-5 text-primary" />
      <span className="text-[11px] text-muted-foreground">Frete grátis</span>
    </div>
    <div className="flex flex-col items-center gap-1.5">
      <BadgeCheck className="w-5 h-5 text-primary" />
      <span className="text-[11px] text-muted-foreground">Garantia de 30 dias</span>
    </div>
  </div>
);

export default CheckoutTrustRow;
