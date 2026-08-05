import { useState, useEffect } from "react";
import { Zap } from "lucide-react";

/**
 * Componente que exibe a contagem regressiva de "Promoção encerra em MM:SS".
 * Mantém a lógica original de cronômetro, reiniciando ao chegar em zero.
 */
const FlashSaleTimer = () => {
  const [time, setTime] = useState({ m: 17, s: 46 });

  // Lógica do cronômetro regressivo
  useEffect(() => {
    const interval = setInterval(() => {
      setTime((t) => {
        let { m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 17; s = 46; }
        return { m, s };
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
    <div className="flex items-center gap-1.5 text-sm text-urgent font-medium">
      <Zap className="w-4 h-4 fill-urgent" />
      <span>
        Promoção encerra em {pad(time.m)}:{pad(time.s)}
      </span>
    </div>
  );
};

export default FlashSaleTimer;
