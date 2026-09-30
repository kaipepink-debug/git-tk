import { Star } from "lucide-react";
import { STORE_NAME } from "@/data/storeContent";

/**
 * Componente que exibe informações básicas sobre a loja/vendedor.
 * Mostra o avatar da loja, nome, status online e estatísticas (nota, vendas, avaliações positivas).
 */
const StoreInfo = () => {
  return (
    <div className="bg-background px-4 py-4 mt-2">
      <div className="flex items-center gap-3">
        {/* Avatar da Loja — sem logo por ora: a inicial num círculo, como a
            Shopee mostra vendedor sem foto. Melhor um marcador neutro do que
            uma logo que contradiz o que está à venda. */}
        <div className="w-12 h-12 rounded-full flex-shrink-0 bg-primary text-primary-foreground
                        flex items-center justify-center font-bold text-lg select-none"
             aria-hidden="true">
          {STORE_NAME.charAt(0)}
        </div>

        {/* Informações Textuais da Loja */}
        <div className="flex-1 min-w-0">
          {/* Nome e Indicador de Status Online */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">{STORE_NAME}</h3>
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-[10px] text-success font-medium">Online</span>
            </div>
          </div>

          {/* Estatísticas da Loja (Nota, Vendas e Positividade) */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-star text-star" />
              <span className="text-xs font-semibold text-foreground">4.98</span>
            </div>
            <span className="text-muted-foreground text-[10px]">|</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">+16 mil vendas</span>
            <span className="text-muted-foreground text-[10px]">|</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">98% positivas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreInfo;
