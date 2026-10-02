import { useProduct } from "@/contexts/ProductContext";

/**
 * Faixa de preço no mesmo visual da oferta relâmpago, mas sem cronômetro e sem
 * preço riscado: para produto que não está em promoção, não há o que contar.
 */
const PriceBanner = () => {
  const { priceDisplay, sizes, selectedSize } = useProduct();
  const pronta = (sizes[selectedSize]?.delivery || "").startsWith("Pronta");

  return (
    <div
      className="flex items-center justify-between"
      style={{ background: "linear-gradient(to right, rgb(251,84,52), rgb(251,56,74))", padding: "12px 16px" }}
    >
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1 text-white">
          <span className="text-sm font-bold">R$</span>
          <span className="text-2xl font-extrabold leading-none">{priceDisplay}</span>
        </div>
        <span className="text-xs text-white/90 mt-1">à vista no Pix</span>
      </div>
      <div className="flex flex-col items-end text-white text-xs font-semibold gap-1">
        <span className="rounded-full bg-white/20 px-2.5 py-0.5">{pronta ? "Pronta entrega" : "Sob encomenda"}</span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5">Frete incluso</span>
      </div>
    </div>
  );
};

export default PriceBanner;
