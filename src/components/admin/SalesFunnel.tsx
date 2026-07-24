import { ArrowDown } from "lucide-react";

interface SalesFunnelProps {
  visitors: number;
  checkoutStarted: number;
  pixGenerated: number;
  pixPaid: number;
}

const SalesFunnel = ({ visitors, checkoutStarted, pixGenerated, pixPaid }: SalesFunnelProps) => {
  const steps = [
    { label: "Visitantes", value: visitors, color: "hsl(210,100%,65%)", bg: "hsl(210,100%,12%)" },
    { label: "Checkout Iniciado", value: checkoutStarted, color: "hsl(45,100%,60%)", bg: "hsl(45,100%,10%)" },
    { label: "PIX Gerado", value: pixGenerated, color: "hsl(14,100%,55%)", bg: "hsl(14,100%,10%)" },
    { label: "PIX Pago", value: pixPaid, color: "hsl(145,70%,50%)", bg: "hsl(145,70%,10%)" },
  ];

  const maxValue = Math.max(visitors, 1);

  return (
    <div className="bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl p-5">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-white">Funil de Vendas</h3>
        <p className="text-[10px] text-[hsl(220,10%,40%)] mt-0.5">Conversão em cada etapa</p>
      </div>
      <div className="space-y-1">
        {steps.map((step, i) => {
          const width = Math.max((step.value / maxValue) * 100, 12);
          const convFromPrev = i > 0 && steps[i - 1].value > 0
            ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
            : null;

          return (
            <div key={step.label}>
              {i > 0 && (
                <div className="flex items-center justify-center py-1">
                  <div className="flex items-center gap-1.5">
                    <ArrowDown className="w-3 h-3 text-[hsl(220,10%,30%)]" />
                    {convFromPrev && (
                      <span className="text-[9px] font-bold text-[hsl(220,10%,40%)]">{convFromPrev}%</span>
                    )}
                  </div>
                </div>
              )}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: step.color }} />
                    <span className="text-[11px] font-medium text-[hsl(220,10%,65%)]">{step.label}</span>
                  </div>
                  <span className="text-sm font-bold text-white tabular-nums">{step.value}</span>
                </div>
                <div className="h-8 bg-[hsl(220,20%,14%)] rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-1000 ease-out flex items-center px-3"
                    style={{
                      width: `${width}%`,
                      background: `linear-gradient(90deg, ${step.color}dd, ${step.color}88)`,
                    }}
                  >
                    {step.value > 0 && (
                      <span className="text-[10px] font-bold text-white/90">
                        {((step.value / maxValue) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Overall conversion */}
      <div className="mt-5 pt-4 border-t border-[hsl(220,15%,16%)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[hsl(220,10%,45%)] uppercase tracking-wider font-medium">Conversão Total</span>
          <span className="text-sm font-bold" style={{ color: visitors > 0 ? "hsl(145,70%,50%)" : "hsl(220,10%,45%)" }}>
            {visitors > 0 ? `${((pixPaid / visitors) * 100).toFixed(1)}%` : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesFunnel;
