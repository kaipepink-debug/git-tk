/**
 * Rota: /pagamento-pix
 * Propósito: Exibe o código "Copia e Cola" e o QR Code do Pix gerados pelo checkout.
 * Inclui lógica de temporizador de expiração e polling (verificação recorrente)
 * do status do pagamento via Supabase Edge Function.
 */

import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Copy, Check, Loader2, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Componente da página de Pagamento Pix.
 * Gerencia o tempo de expiração e redireciona automaticamente após a confirmação do pagamento.
 */
const PagamentoPix = () => {

  // Sinaliza que um Pix foi gerado para disparar lógica de retenção se o usuário tentar sair
  useEffect(() => {
    sessionStorage.setItem("pix_generated", "true");
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const pixData = location.state as { pixCode?: string; pixQrCode?: string; total?: number; transactionId?: string } | null;
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [paymentStatus, setPaymentStatus] = useState<string>("pending");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Efeito do temporizador regressivo (15 minutos)
  useEffect(() => {
    if (!pixData?.pixCode) {
      navigate("/finalizar-compra");
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pixData, navigate]);

  // Efeito de Polling: verifica o status do pagamento a cada 5 segundos
  useEffect(() => {
    if (!pixData?.transactionId || paymentStatus === "paid") return;

    // BUGFIX: usar flag por ref para evitar múltiplas execuções concorrentes
    // e redirects duplicados quando a resposta chega quase simultaneamente.
    let stopped = false;

    const checkPayment = async () => {
      if (stopped) return;
      try {
        const { data, error } = await supabase.functions.invoke("check-payment", {
          body: { transaction_id: pixData.transactionId },
        });

        if (error) {
          // Erro de rede/edge function — não interrompe o polling, apenas loga.
          console.warn("Falha ao consultar pagamento:", error.message);
          return;
        }

        if (data?.error) {
          console.warn("Gateway retornou erro:", data.error);
          return;
        }

        if (data?.status === "paid" && !stopped) {
          stopped = true;
          setPaymentStatus("paid");
          if (pollingRef.current) clearInterval(pollingRef.current);

          // Redireciona para a página de obrigado
          setTimeout(() => {
            window.location.href = "/obrigado";
          }, 1500);
        }
      } catch (err) {
        console.error("Erro no polling de pagamento:", err);
      }
    };

    checkPayment();
    pollingRef.current = setInterval(checkPayment, 5000);

    return () => {
      stopped = true;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pixData?.transactionId, paymentStatus]);

  /**
   * Formata os segundos em MM:SS.
   */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  /**
   * Copia o código Pix para a área de transferência.
   */
  /**
   * Copia o código Pix para a área de transferência com tratamento de erros
   * (ex.: navegador sem suporte ou permissão negada).
   */
  const handleCopy = async () => {
    if (!pixData?.pixCode) return;
    try {
      await navigator.clipboard.writeText(pixData.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Erro ao copiar código PIX:", err);
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  };

  if (!pixData) return null;

  // Tela de transição exibida quando o pagamento é detectado como pago
  if (paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-secondary max-w-lg mx-auto flex flex-col items-center justify-center px-4" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif" }}>
        <div className="bg-background rounded-xl p-8 border border-border text-center w-full">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "#00b94a20" }}>
            <Check className="w-8 h-8" style={{ color: "#00b94a" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Pagamento Confirmado!</h2>
          <p className="text-sm text-muted-foreground mb-4">Redirecionando você...</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary max-w-lg mx-auto flex flex-col" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background flex items-center px-4 py-3 border-b border-border">
        <button onClick={() => navigate("/finalizar-compra")} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground flex-1 text-center pr-9">Pagamento PIX</h1>
      </div>

      {/* Duas caixas, não seis: a primeira diz em que pé está o pagamento,
          a segunda é onde se paga. Antes cada informação tinha a sua própria
          moldura, e uma tela toda de quadros iguais não diz o que olhar
          primeiro — o valor competia com o cronômetro, e o QR Code competia
          com o código, quando na verdade são o mesmo passo feito de dois
          jeitos. */}
      <div className="flex-1 flex flex-col px-4 py-5 gap-4">

        {/* ---------- Em que pé está ---------- */}
        <div className="bg-background rounded-xl w-full border border-border overflow-hidden">
          <div className="flex items-center justify-center gap-2 py-2.5 border-b border-border bg-secondary">
            <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#FF2B56" }} />
            <p className="text-xs font-medium text-muted-foreground">Aguardando pagamento</p>
          </div>

          <div className="px-4 py-5 text-center">
            <p className="text-xs text-muted-foreground mb-1">Valor total</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              R$ {pixData.total?.toFixed(2).replace(".", ",")}
            </p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-secondary">
              <Clock className="w-3.5 h-3.5" style={{ color: "#FF2B56" }} />
              <span className="text-xs text-muted-foreground">Expira em</span>
              {/* fonte tabular: sem ela o cronômetro empurra o texto a cada segundo */}
              <span className="text-sm font-bold tabular-nums" style={{ color: "#FF2B56" }}>
                {formatTime(timeLeft)}
              </span>
            </div>
          </div>
        </div>

        {/* ---------- Onde se paga ---------- */}
        <div className="bg-background rounded-xl w-full border border-border overflow-hidden">

          {/* O QR Code vem primeiro: quem está com o celular na mão resolve aqui
              e não precisa ler mais nada. */}
          {pixData.pixCode && (
            <div className="flex flex-col items-center pt-6 pb-5 px-4">
              <QRCodeSVG value={pixData.pixCode} size={196} />
              <p className="text-xs text-muted-foreground mt-3">
                Escaneie pelo app do seu banco
              </p>
            </div>
          )}

          {/* Mesma tarefa, outro caminho — para quem está pagando pelo próprio
              celular e não tem como escanear a própria tela. */}
          <div className="relative px-4">
            <div className="border-t border-border" />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-background px-2
                             text-[10px] uppercase tracking-wide text-muted-foreground">
              ou copie o código
            </span>
          </div>

          <div className="px-4 pt-5 pb-4">
            <div className="bg-secondary rounded-lg p-3 text-[11px] leading-relaxed
                            text-muted-foreground break-all max-h-20 overflow-y-auto mb-3">
              {pixData.pixCode}
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-3.5 rounded-lg text-base font-bold text-white
                         flex items-center justify-center gap-2 transition-opacity active:opacity-80"
              style={{ background: copied ? "#00b94a" : "#FF2B56" }}
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? "Código copiado" : "Copiar código PIX"}
            </button>
          </div>
        </div>

        {/* Instruções sem moldura: são apoio, não mais um cartão disputando atenção. */}
        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-5 px-1 pb-2">
          <li>Abra o app do seu banco</li>
          <li>Escolha pagar via PIX</li>
          <li>Escaneie o QR Code ou cole o código copiado</li>
          <li>Confirme o pagamento — esta tela avisa sozinha quando cair</li>
        </ol>

      </div>
    </div>
  );
};

export default PagamentoPix;
