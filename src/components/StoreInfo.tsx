import { Star } from "lucide-react";

const StoreInfo = () => {
  return (
    <div className="bg-background px-4 py-4 mt-2">
      <div className="flex items-center gap-3">
        {/* Store Avatar */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border flex-shrink-0">
          <img
            src="/images/loja-logo.png"
            alt="Mestre de Obra"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Store Info */}
        <div className="flex-1 min-w-0">
          {/* Name + Online */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm font-bold text-foreground">Mestre de Obra</h3>
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
              </span>
              <span className="text-[10px] text-success font-medium">Online</span>
            </div>
          </div>

          {/* Stats numa linha única compacta */}
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
