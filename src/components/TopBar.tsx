import { Menu, ShoppingCart, Truck, ShieldCheck, Phone } from "lucide-react";

/**
 * Componente de barra superior (Header) da página de produto.
 * Inclui a faixa de oferta, o cabeçalho com a marca e a faixa de confiança,
 * seguindo o estilo visual de lojas premium de tênis esportivos.
 */
const TopBar = () => {
  return (
    <div className="sticky top-0 z-50">
      {/* Faixa de anúncio da oferta */}
      <div className="bg-ink text-ink-foreground text-center py-1.5 px-2">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide">
          Oferta exclusiva • 63% off + frete grátis
        </span>
      </div>

      {/* Cabeçalho com logo centralizada */}
      <div className="bg-ink text-ink-foreground flex items-center justify-between px-4 py-2.5">
        <button className="p-1" aria-label="Menu">
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-extrabold italic text-xl tracking-tighter" style={{ fontFamily: "Archivo, system-ui, sans-serif" }}>
          MINAS ESCADAS
        </span>
        <button className="p-1" aria-label="Carrinho">
          <ShoppingCart className="w-5 h-5" />
        </button>
      </div>

      {/* Faixa de confiança - Otimizada para Mobile */}
      <div className="bg-background border-b border-border overflow-x-auto no-scrollbar">
        <div className="flex items-center whitespace-nowrap px-4 py-2 gap-6 min-w-max mx-auto lg:justify-center">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
            <Truck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>Frete grátis para todo o Brasil</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground border-l border-border pl-6">
            <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>Garantia de 30 dias</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground border-l border-border pl-6">
            <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>SAC: (14) 3256-5533</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
