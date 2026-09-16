/**
 * Rota: /finalizar-compra
 * Propósito: Página de Checkout (resumo do pedido). Permite ao usuário revisar itens,
 * escolher o método de entrega, forma de pagamento e gerar o código PIX para pagamento.
 */

import { useNavigate } from "react-router-dom";
import { ChevronLeft, Minus, Plus, Loader2 } from "lucide-react";
import { useProduct } from "@/contexts/ProductContext";
import { useOptimizedImage } from "@/hooks/useOptimizedImage";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSessionTracker } from "@/hooks/useSessionTracker";
import { getTikTokClickId, getTikTokTtp } from "@/lib/tiktokClickId";
import pixIcon from "@/assets/pix.svg";

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
  const [frete, setFrete] = useState<"gratis" | "expresso">("expresso");
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

  // Preparação de imagem e cálculos de valores
  const productImageRaw = product.cart_image || "/images/escada-carrinho.webp";
  const productImage = useOptimizedImage(productImageRaw, 160, 0.6);
  const productName = product.title ? product.title.substring(0, 40) + "..." : "Produto";
  const descontoValor = oldPrice - price;
  const freteExpresso = 9.80;
  const total = frete === "gratis" ? price * qty : price * qty + freteExpresso;

  return (
    <div className="min-h-screen bg-secondary max-w-lg mx-auto flex flex-col pb-4" style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background flex items-center px-4 py-3 border-b border-border">
        <button onClick={() => navigate(-1)} className="mr-3">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 className="text-base font-semibold text-foreground flex-1 text-center pr-9">Resumo do pedido</h1>
      </div>

      {/* Seção de Endereço — Exibe endereço salvo ou botão para adicionar */}
      <div className="bg-background mt-2 px-4 py-3 flex flex-col gap-3">
        {enderecoData ? (
          <button onClick={() => navigate("/adicionar-endereco")} className="w-full flex items-center gap-3 py-3 text-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="flex-shrink-0"><circle cx="12" cy="10" r="3" stroke="#FF2B56" strokeWidth="2"/><path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z" stroke="#FF2B56" strokeWidth="2" fill="none"/></svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{enderecoData.nome}, (55) {enderecoData.telefone}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {enderecoData.endereco}, {enderecoData.numero}, {enderecoData.bairro}, {enderecoData.cidade}, {enderecoData.estado}, {enderecoData.cep}
              </p>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 flex-shrink-0" />
          </button>
        ) : (
          <button onClick={() => navigate("/adicionar-endereco")} className="w-full flex items-center gap-3 py-4 px-4 border border-border rounded-lg text-left" style={{ background: "#f5f5f5" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            <span className="font-semibold text-sm text-foreground">Adicionar endereço de entrega</span>
          </button>
        )}
      </div>

      {/* Divisor estético em formato tracejado colorido */}
      <div className="bg-background px-4 pb-1">
        <div className="h-0.5" style={{ backgroundImage: "repeating-linear-gradient(90deg, #00b5e4 0px, #00b5e4 8px, transparent 8px, transparent 12px, #ff2b56 12px, #ff2b56 20px, transparent 20px, transparent 24px)", backgroundSize: "24px 2px" }} />
      </div>

      <div className="bg-background px-4 py-3">
        <span className="text-sm text-muted-foreground">Loja (1)</span>
      </div>

      {/* Banner informativo de frete */}
      <div className="bg-[hsl(170,60%,95%)] px-4 py-2 flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 -2 20 20" xmlns="http://www.w3.org/2000/svg"><g transform="translate(-2 -4)"><path d="M9.17,17H13V6a1,1,0,0,0-1-1H5" fill="none" stroke="#00BFA5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><path d="M3,13v3a1,1,0,0,0,1,1h.87" fill="none" stroke="#00BFA5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><path d="M14.87,17H13V7h4.25a1,1,0,0,1,1,.73L19,10.5l1.24.31a1,1,0,0,1,.76,1V16a1,1,0,0,1-1,1h-.89" fill="none" stroke="#00BFA5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/><path d="M9,17a2,2,0,1,1-2-2A2,2,0,0,1,9,17Zm8-2a2,2,0,1,0,2,2A2,2,0,0,0,17,15ZM3,9H9" fill="none" stroke="#00BFA5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></g></svg>
        <span className="text-xs font-medium" style={{ color: "#00BFA5" }}>Você ganhou frete grátis!</span>
      </div>

      {/* Card do Produto revisado */}
      <div className="bg-background px-4 py-3 flex items-start gap-3">
        <img src={productImage} alt={productName} className="w-20 h-20 object-contain rounded bg-secondary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-tight line-clamp-2">{productName}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-base font-bold" style={{ color: "#FF2B56", fontFamily: "'Segoe UI',Roboto,sans-serif" }}>R$ {priceDisplay}</span>
            <svg fill="#FF2B56" width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}><path d="M10,5V7m0,10v2m0-6V11" style={{ fill: "none", stroke: "#FF2B56", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }} /><path d="M18,12a3,3,0,0,0,3,3v3a1,1,0,0,1-1,1H4a1,1,0,0,1-1-1V15A3,3,0,0,0,3,9V6A1,1,0,0,1,4,5H20a1,1,0,0,1,1,1V9A3,3,0,0,0,18,12Z" style={{ fill: "none", stroke: "#FF2B56", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }} /></svg>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground line-through">R$ {oldPriceDisplay}</span>
            <span className="text-xs font-semibold px-1 rounded" style={{ background: "#FFE8ED", color: "#FF2B56" }}>-{discount}%</span>
          </div>
        </div>
        <div className="flex items-center border border-border rounded self-center">
          <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-1.5">
            <Minus className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="w-8 text-center text-sm text-foreground">{qty}</span>
          <button onClick={() => setQty(q => q + 1)} className="p-1.5">
            <Plus className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      <div className="h-2 bg-secondary" />

      {/* Seleção de Frete */}
      <div className="bg-background px-4 py-4">
        <span className="text-sm font-semibold text-foreground">Frete</span>
        <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: frete === "gratis" ? "#FF2B56" : "transparent", border: frete === "gratis" ? "none" : "2px solid #ccc" }}>
              {frete === "gratis" && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Frete Grátis</p>
              <p className="text-xs text-muted-foreground">Entrega de 4 a 7 dias</p>
            </div>
          </div>
          <span className="text-sm font-medium" style={{ color: "#00BFA5" }}>Grátis</span>
          <input type="radio" name="frete" className="hidden" checked={frete === "gratis"} onChange={() => setFrete("gratis")} />
        </label>
        <label className="flex items-center justify-between py-3 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: frete === "expresso" ? "#FF2B56" : "transparent", border: frete === "expresso" ? "none" : "2px solid #ccc" }}>
              {frete === "expresso" && <div className="w-2 h-2 rounded-full bg-white" />}
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

      <div className="h-2 bg-secondary" />

      {/* Detalhamento de valores */}
      <div className="bg-background px-4 py-4">
        <span className="text-sm font-semibold text-foreground">Resumo do pedido</span>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-sm text-foreground">R$ {(oldPrice * qty).toFixed(2).replace(".", ",")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm" style={{ color: "#00BFA5" }}>Descontos</span>
            <span className="text-sm" style={{ color: "#00BFA5" }}>-R$ {(descontoValor * qty).toFixed(2).replace(".", ",")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Frete</span>
            <span className="text-sm" style={{ color: frete === "gratis" ? "#00BFA5" : undefined }}>
              {frete === "gratis" ? "Grátis" : `R$ ${freteExpresso.toFixed(2).replace(".", ",")}`}
            </span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="text-base font-bold text-foreground">Total</span>
            <div className="text-right">
              <span className="text-base font-bold" style={{ color: "#FF2B56", fontFamily: "'Segoe UI',Roboto,sans-serif" }}>R$ {total.toFixed(2).replace(".", ",")}</span>
              <p className="text-xs text-muted-foreground">Impostos inclusos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="h-2 bg-secondary" />

      {/* Seleção de Pagamento — Atualmente restrito ao Pix conforme regras da promoção */}
      <div className="bg-background px-4 py-4">
        <span className="text-sm font-semibold text-foreground">Forma de pagamento</span>
        <label className="flex items-center justify-between py-3 border-b border-border cursor-pointer mt-2 rounded-lg border px-3" style={{ borderColor: pagamento === "pix" ? "#FF2B56" : undefined, background: pagamento === "pix" ? "#FFF5F7" : undefined }}>
          <div className="flex items-center gap-3">
            <img src={pixIcon} alt="Pix" width="28" height="28" className="rounded" />
            <div>
              <p className="text-sm font-medium text-foreground">Pix</p>
              <p className="text-xs text-muted-foreground">Único meio de pagamento disponível para esta promoção.</p>
            </div>
          </div>
          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2" style={{ background: pagamento === "pix" ? "#FF2B56" : "transparent", border: pagamento === "pix" ? "none" : "2px solid #ccc" }}>
            {pagamento === "pix" && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <input type="radio" name="pagamento" className="hidden" checked={pagamento === "pix"} onChange={() => setPagamento("pix")} />
        </label>
      </div>

      <div className="px-4 py-2 flex items-center gap-2 bg-[hsl(170,60%,95%)]">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="10" fill="#00BFA5"/><path d="M6 10.5L9 13.5L14.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span className="text-xs" style={{ color: "#00BFA5" }}>Você está economizando R$ {descontoValor.toFixed(2).replace(".", ",")} neste pedido.</span>
      </div>

      {/* Rodapé fixo com o botão de criação de pedido/pix */}
      <div className="bg-background border-t border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-foreground">Total ({qty} {qty === 1 ? "item" : "itens"})</span>
          <span className="text-lg font-bold" style={{ color: "#FF2B56", fontFamily: "'Segoe UI',Roboto,sans-serif" }}>R$ {total.toFixed(2).replace(".", ",")}</span>
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
                  // URL real da página do produto, usada pelo gateway de pagamento
                  product_url: `${window.location.origin}/produto`,
                  // Identificadores do clique no anúncio do TikTok (atribuição da venda)
                  ttclid: getTikTokClickId(),
                  ttp: getTikTokTtp(),
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
          className="w-full py-2.5 rounded-lg text-base font-bold text-background flex flex-col items-center disabled:opacity-70"
          style={{ background: "#FF2B56", border: "none" }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-background" />
          ) : (
            <>
              <span style={{ fontSize: 16 }}>Fazer pedido</span>
              <span className="text-xs font-normal opacity-90">O cupom expira em 13:32</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default FinalizarCompra;
