import { useState, useEffect } from "react";
import { useProduct } from "@/contexts/ProductContext";

/**
 * Componente que exibe um banner de "Oferta Relâmpago" com temporizador regressivo.
 * Inclui o preço atual, desconto e um cronômetro de urgência.
 */
const FlashSaleTimer = () => {
  const { price, priceDisplay, oldPriceDisplay, discount } = useProduct();
  const [time, setTime] = useState({ h: 0, m: 17, s: 46 });

  // Lógica do cronômetro regressivo
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 0; m = 0; s = 0; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Formata números com zero à esquerda (ex: 09)
   * @param n Número a ser formatado
   */
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div
      className="relative flex items-center justify-between overflow-hidden"
      style={{
        background: "linear-gradient(to right, rgb(251,84,52), rgb(251,56,74))",
        padding: "10px 16px",
      }}
    >
      {/* Elemento visual de fundo: raio de luz */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          right: "88px",
          top: "50%",
          transform: "translateY(-50%)",
          width: "120px",
          height: "120px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <defs>
          <linearGradient id="lightningOpacityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points="8.29 1.71 18.5 1.71 13.86 9.14 17.57 9.14 7.36 20.29 9.21 12.86 5.5 12.86 8.29 1.71"
          fill="url(#lightningOpacityGradient)"
        />
      </svg>

      {/* Lado esquerdo: selo de desconto e preço atual */}
      <div className="relative z-10 flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-3 flex-wrap">
          <div
            style={{
              background: "white",
              color: "rgb(255,43,86)",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "15px",
              fontWeight: 600,
            }}
          >
            -{discount}%
          </div>
          <div
            className="flex items-baseline gap-1"
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "white",
              fontFamily: '"Segoe UI", sans-serif',
            }}
          >
            <span style={{ fontSize: "16px", fontWeight: 700 }}>R$</span>
            <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>{priceDisplay}</span>
          </div>
        </div>
        <div
          style={{
            fontSize: "16px",
            color: "white",
            textDecoration: "line-through",
          }}
        >
          R$ {oldPriceDisplay}
        </div>
      </div>

      {/* Lado direito: etiqueta de oferta relâmpago e cronômetro */}
      <div
        className="flex flex-col items-end justify-end gap-1 flex-shrink-0 absolute z-10"
        style={{ bottom: "5px", right: "16px" }}
      >
        <div className="flex items-center gap-1 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon
              points="8.29 1.71 18.5 1.71 13.86 9.14 17.57 9.14 7.36 20.29 9.21 12.86 5.5 12.86 8.29 1.71"
              fill="#ffffff"
            />
          </svg>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "white",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Oferta relâmpago
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ fontSize: "11px", color: "white" }}>Vai encerrar em</span>
          <span style={{ fontSize: "12px", color: "white", letterSpacing: "0.5px" }}>
            {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleTimer;
