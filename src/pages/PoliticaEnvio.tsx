import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PoliticaEnvio = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Política de Envio</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>A JP Variedades LTDA se compromete a enviar seus pedidos com agilidade e segurança.</p>

        <h2 className="text-base font-semibold text-foreground">1. Prazo de Envio</h2>
        <p>Após a confirmação do pagamento, o pedido será enviado em até 3 dias úteis. O prazo de entrega varia conforme a região e a transportadora utilizada.</p>

        <h2 className="text-base font-semibold text-foreground">2. Frete</h2>
        <p>O frete é calculado com base no CEP de destino e no peso/dimensão do produto. Promoções de frete grátis podem ser aplicadas conforme disponibilidade.</p>

        <h2 className="text-base font-semibold text-foreground">3. Rastreamento</h2>
        <p>Após o envio, você receberá o código de rastreamento por e-mail para acompanhar a entrega do seu pedido.</p>

        <h2 className="text-base font-semibold text-foreground">4. Problemas na Entrega</h2>
        <p>Caso haja problemas na entrega (extravio, atraso significativo), entre em contato conosco para resolvermos a situação o mais rápido possível.</p>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Última atualização: março de 2026. JP VARIEDADES LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default PoliticaEnvio;
