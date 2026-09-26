/**
 * Rota: /obrigado
 * Propósito: Página de agradecimento exibida após a confirmação do pagamento.
 * Fornece informações sobre postagem, rastreamento e suporte pós-venda.
 */

import { CheckCircle2, Package, Truck, Mail } from "lucide-react";
import { useEffect } from "react";

/**
 * Componente da página de Obrigado.
 * Limpa estados de sessão e orienta o cliente sobre os próximos passos.
 */
const Obrigado = () => {
  // Rastreia a sessão

  useEffect(() => {
    // Limpa dados de oferta da sessão após conclusão bem-sucedida
    sessionStorage.removeItem("presell_unlocked");
  }, []);

  return (
    <div className="min-h-screen bg-secondary max-w-lg mx-auto flex flex-col items-center px-6 pt-12 pb-20"
      style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,sans-serif" }}>
      
      {/* Ícone de Sucesso */}
      <div className="w-20 h-20 rounded-full bg-[hsl(145,70%,94%)] flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-[hsl(145,70%,40%)]" />
      </div>

      <h1 className="text-xl font-bold text-foreground text-center mb-2">
        Pagamento Confirmado!
      </h1>
      <p className="text-sm text-muted-foreground text-center mb-8">
        Obrigado pela sua compra 🎉
      </p>

      {/* Cards informativos sobre logística e comunicação */}
      <div className="w-full space-y-3 mb-8">
        <div className="bg-background rounded-xl p-4 flex items-start gap-3 border border-border">
          <div className="w-10 h-10 rounded-lg bg-[hsl(210,100%,95%)] flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-[hsl(210,100%,50%)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Seu pedido será postado o quanto antes</p>
            <p className="text-xs text-muted-foreground mt-1">
              Estamos preparando seu pedido com todo carinho para envio o mais rápido possível.
            </p>
          </div>
        </div>

        <div className="bg-background rounded-xl p-4 flex items-start gap-3 border border-border">
          <div className="w-10 h-10 rounded-lg bg-[hsl(30,100%,94%)] flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-[hsl(30,100%,45%)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Código de rastreio</p>
            <p className="text-xs text-muted-foreground mt-1">
              O código de rastreio será enviado assim que for disponibilizado pela transportadora. Fique tranquilo!
            </p>
          </div>
        </div>

        <div className="bg-background rounded-xl p-4 flex items-start gap-3 border border-border">
          <div className="w-10 h-10 rounded-lg bg-[hsl(280,80%,94%)] flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-[hsl(280,80%,50%)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Fique de olho no seu e-mail</p>
            <p className="text-xs text-muted-foreground mt-1">
              Todas as atualizações do seu pedido serão enviadas por e-mail.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Agradecemos pela confiança em nossa loja! 💚
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Qualquer dúvida, entre em contato com nosso suporte.
        </p>
      </div>
    </div>
  );
};

export default Obrigado;
