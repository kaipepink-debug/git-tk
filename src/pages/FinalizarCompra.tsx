/**
 * Rota: /finalizar-compra
 * Propósito: Página de Checkout (resumo do pedido). Permite ao usuário revisar itens,
 * escolher o método de entrega, forma de pagamento e gerar o código PIX para pagamento.
 */

import { useNavigate } from "react-router-dom";
import { Minus, Plus, Loader2, MapPin, ChevronRight } from "lucide-react";
import { useProduct } from "@/contexts/ProductContext";
import { useOptimizedImage } from "@/hooks/useOptimizedImage";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { trackTikTokEvent } from "@/hooks/useTikTokPixel";
import pixIcon from "@/assets/pix.svg";
import CheckoutHeader from "@/components/CheckoutHeader";
import CheckoutTrustRow from "@/components/CheckoutTrustRow";

/**
 * Estrutura dos dados de endereço e contato do usuário.
 */
interface EnderecoData {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  endereco: string;
  numero: string;
}

/**
 * Componente da página de Finalização de Compra.
 * Centraliza a lógica de cálculo de totais, seleção de frete e integração com o gateway de pagamento.
 */
const FinalizarCompra = () => {
  // Rastreia a navegação
  useSessionTracker("/finalizar-compra");

  const navigate = useNavigate();
  const [qty, setQty] = useState(1);
  const [frete, setFrete] = useState<"gratis" | "expresso">("gratis");
  const [pagamento, setPagamento] = useState<"pix" | "cartao">("pix");
  const [enderecoData, setEnderecoData] = useState<EnderecoData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carrega dados de endereço salvos localmente
  useEffect(() => {
    const saved = localStorage.getItem("endereco");
    if (saved) {
      try { setEnderecoData(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  const { price: originalPrice, oldPrice, discount, priceDisplay: originalPriceDisplay, oldPriceDisplay, product } = useProduct();

  // Verifica se existe uma oferta especial de retenção (exit-intent) ativa na sessão
  const exitOfferPrice = sessionStorage.getItem("exit_offer_price");
  const price = exitOfferPrice ? parseFloat(exitOfferPrice) : originalPrice;
  // BUGFIX: antes hardcoded "48,00" — quebrava se a oferta mudasse. Derivar do preço.
  const priceDisplay = exitOfferPrice ? price.toFixed(2).replace(".", ",") : originalPriceDisplay;

  // Dispara evento de checkout no TikTok Pixel
  useEffect(() => {
    trackTikTokEvent("InitiateCheckout", {
      contents: [{
        content_id: product.id || "product",
        content_type: "product",
        content_name: product.title || "Produto",
        quantity: 1,
        price,
      }],
      currency: "BRL",
      value: price,
    });
  }, [product.id, product.title, price]);


  // Preparação de imagem e cálculos de valores
  const productImageRaw = product.cart_image || "/images/escada-carrinho.webp";
  const productImage = useOptimizedImage(productImageRaw, 160, 0.6);
  const productName = product.title ? product.title.substring(0, 40) + "..." : "Produto";
  const descontoValor = oldPrice - price;
  const freteExpresso = 9.80;
  const total = frete === "gratis" ? price * qty : price * qty + freteExpresso;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-4">
      <CheckoutHeader onBack={() => navigate(-1)} step="dados" />

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-6 space-y-4">
        <h1 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resumo do pedido</h1>

        {/* Seção de Endereço — Exibe endereço salvo ou botão para adicionar */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
          {enderecoData ? (
            <button onClick={() => navigate("/adicionar-endereco")} className="w-full flex items-center gap-3 text-left">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{enderecoData.nome}, (55) {enderecoData.telefone}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {enderecoData.endereco}, {enderecoData.numero}, {enderecoData.bairro}, {enderecoData.cidade}, {enderecoData.estado}, {enderecoData.cep}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          ) : (
            <button onClick={() => navigate("/adicionar-endereco")} className="w-full flex items-center gap-3 py-3 px-4 border border-dashed border-border rounded-xl text-left bg-muted">
              <Plus className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="font-semibold text-sm text-foreground">Adicionar endereço de entrega</span>
            </button>
          )}
        </div>

        {/* Banner informativo de frete */}
        <div className="rounded-2xl bg-primary/10 px-4 py-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">Você ganhou frete grátis!</span>
        </div>

        {/* Card do Produto revisado */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 flex items-start gap-4">
          <img src={productImage} alt={productName} className="w-20 h-20 object-contain rounded-xl bg-muted flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">{productName}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg font-bold text-primary">R$ {priceDisplay}</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">-{discount}%</span>
            </div>
            <span className="text-xs text-muted-foreground line-through">R$ {oldPriceDisplay}</span>
          </div>
          <div className="flex items-center border border-border rounded-full self-center">
            <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-2">
              <Minus className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-foreground">{qty}</span>
            <button onClick={() => setQty(q => q + 1)} className="p-2">
              <Plus className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Seleção de Frete */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Frete</span>
          <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer mt-2">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${frete === "gratis" ? "bg-primary border-primary" : "border-border"}`}>
                {frete === "gratis" && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Frete Grátis</p>
                <p className="text-xs text-muted-foreground">Entrega de 4 a 7 dias</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-primary">Grátis</span>
            <input type="radio" name="frete" className="hidden" checked={frete === "gratis"} onChange={() => setFrete("gratis")} />
          </label>
          <label className="flex items-center justify-between py-3 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${frete === "expresso" ? "bg-primary border-primary" : "border-border"}`}>
                {frete === "expresso" && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Frete Expresso</p>
                <p className="text-xs text-muted-foreground">Entrega de 2 a 4 dias</p>
              </div>
            </div>
            <span className="text-sm text-foreground">R$ {freteExpresso.toFixed(2).replace(".", ",")}</span>
            <input type="radio" name="frete" className="hidden" checked={frete === "expresso"} onChange={() => setFrete("expresso")} />
          </label>
        </div>

        {/* Detalhamento de valores */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resumo do pedido</span>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-sm text-foreground">R$ {(oldPrice * qty).toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-primary">Descontos</span>
              <span className="text-sm text-primary">-R$ {(descontoValor * qty).toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Frete</span>
              <span className={`text-sm ${frete === "gratis" ? "text-primary font-semibold" : "text-foreground"}`}>
                {frete === "gratis" ? "Grátis" : `R$ ${freteExpresso.toFixed(2).replace(".", ",")}`}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="text-base font-bold text-foreground">Total</span>
              <div className="text-right">
                <span className="text-xl font-bold text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
                <p className="text-xs text-muted-foreground">Impostos inclusos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seleção de Pagamento — Atualmente restrito ao Pix conforme regras da promoção */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Forma de pagamento</span>
          <label className={`flex items-center justify-between py-3 cursor-pointer mt-2 rounded-xl border-2 px-3 ${pagamento === "pix" ? "border-primary bg-primary/5" : "border-border"}`}>
            <div className="flex items-center gap-3">
              <img src={pixIcon} alt="Pix" width="28" height="28" className="rounded" />
              <div>
                <p className="text-sm font-medium text-foreground">Pix</p>
                <p className="text-xs text-muted-foreground">Único meio de pagamento disponível para esta promoção.</p>
              </div>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 border-2 ${pagamento === "pix" ? "bg-primary border-primary" : "border-border"}`}>
              {pagamento === "pix" && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
            </div>
            <input type="radio" name="pagamento" className="hidden" checked={pagamento === "pix"} onChange={() => setPagamento("pix")} />
          </label>
        </div>

        <div className="rounded-2xl bg-primary/10 px-4 py-3 flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">Você está economizando R$ {descontoValor.toFixed(2).replace(".", ",")} neste pedido.</span>
        </div>

        {/* Bloco com total e botão de criação de pedido/pix */}
        <div className="rounded-2xl bg-card border border-border p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">Total ({qty} {qty === 1 ? "item" : "itens"})</span>
            <span className="text-xl font-bold text-foreground">R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
          <button
            onClick={async () => {
              // Validação de endereço e campos obrigatórios antes de chamar o gateway
              if (!enderecoData) {
                toast({ title: "Adicione um endereço de entrega", variant: "destructive" });
                navigate("/adicionar-endereco");
                return;
              }
              if (!enderecoData.cpf) {
                toast({ title: "Adicione seu CPF no endereço", variant: "destructive" });
                navigate("/adicionar-endereco");
                return;
              }
              if (!enderecoData.email) {
                toast({ title: "Adicione um e-mail válido no endereço", variant: "destructive" });
                navigate("/adicionar-endereco");
                return;
              }
              if (total <= 0) {
                toast({ title: "Valor do pedido inválido", description: "Recarregue a página e tente novamente.", variant: "destructive" });
                return;
              }

              setLoading(true);
              try {
                const amountInCents = Math.round(total * 100);
                const { data, error } = await supabase.functions.invoke("create-pix", {
                  body: {
                    amount: amountInCents,
                    qty,
                    customer: {
                      name: enderecoData.nome,
                      email: enderecoData.email,
                      phone_number: enderecoData.telefone,
                      document: enderecoData.cpf,
                      street_name: enderecoData.endereco,
                      number: enderecoData.numero,
                      neighborhood: enderecoData.bairro,
                      city: enderecoData.cidade,
                      state: enderecoData.estado,
                      zip_code: enderecoData.cep,
                    },
                  },
                });

                // Erro de rede/invocação da edge function
                if (error) {
                  console.error("Erro invoke create-pix:", error);
                  throw new Error("Não foi possível conectar ao servidor de pagamento. Verifique sua conexão e tente novamente.");
                }
                // Erro retornado pelo gateway
                if (data?.error) {
                  throw new Error(typeof data.error === "string" ? data.error : "Falha ao gerar o pagamento. Tente novamente.");
                }

                const pixCode = data?.pix?.pix_qr_code || data?.pix?.qr_code || data?.pix?.emv || "";
                const pixQrCode = data?.pix?.qr_code_base64
                  ? (data.pix.qr_code_base64.startsWith("data:") ? data.pix.qr_code_base64 : `data:image/png;base64,${data.pix.qr_code_base64}`)
                  : "";
                const transactionId = String(data?.id || data?.hash || data?.transaction_id || "");

                if (!pixCode) throw new Error("Não foi possível gerar o código PIX. Tente novamente em instantes.");

                // PIX gerado: informações de pagamento adicionadas + pedido criado.
                // A conversão (CompletePayment) só é disparada após a confirmação do pagamento.
                const pixContents = [{
                  content_id: product.id || "product",
                  content_type: "product",
                  content_name: product.title || "Produto",
                  quantity: 1,
                  price: total,
                }];
                trackTikTokEvent("AddPaymentInfo", { contents: pixContents, currency: "BRL", value: total });
                trackTikTokEvent("PlaceAnOrder", { contents: pixContents, currency: "BRL", value: total });


                navigate("/pagamento-pix", {
                  state: { pixCode, pixQrCode, total, transactionId },
                });
              } catch (err: any) {
                console.error("Erro ao gerar PIX:", err);
                toast({
                  title: "Erro ao gerar pagamento",
                  description: err?.message || "Ocorreu um erro inesperado. Tente novamente.",
                  variant: "destructive",
                });
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-4 rounded-full text-base font-bold bg-primary text-primary-foreground flex flex-col items-center disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Fazer pedido</span>
                <span className="text-xs font-normal opacity-90">O cupom expira em 13:32</span>
              </>
            )}
          </button>
        </div>

        <CheckoutTrustRow />
      </div>
    </div>
  );
};

export default FinalizarCompra;
