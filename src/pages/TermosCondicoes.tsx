import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermosCondicoes = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Termos e Condições</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>Ao acessar e utilizar o site da JP Variedades LTDA, você concorda com os termos e condições descritos abaixo.</p>

        <h2 className="text-base font-semibold text-foreground">1. Aceitação dos Termos</h2>
        <p>O uso deste site implica na aceitação integral destes termos. Caso não concorde, por favor, não utilize nossos serviços.</p>

        <h2 className="text-base font-semibold text-foreground">2. Produtos e Preços</h2>
        <p>Os preços exibidos estão sujeitos a alterações sem aviso prévio. Promoções têm prazo de validade limitado. As imagens dos produtos são meramente ilustrativas e podem apresentar variações de cor.</p>

        <h2 className="text-base font-semibold text-foreground">3. Pagamento</h2>
        <p>Aceitamos pagamento via PIX. O pedido será confirmado após a verificação do pagamento.</p>

        <h2 className="text-base font-semibold text-foreground">4. Entrega</h2>
        <p>Os prazos de entrega são estimativas e podem variar conforme a região. A JP Variedades não se responsabiliza por atrasos causados por terceiros (transportadoras, Correios).</p>

        <h2 className="text-base font-semibold text-foreground">5. Responsabilidades do Usuário</h2>
        <p>O usuário é responsável por fornecer informações corretas e atualizadas no momento da compra. Informações incorretas podem resultar em atraso ou cancelamento do pedido.</p>

        <h2 className="text-base font-semibold text-foreground">6. Propriedade Intelectual</h2>
        <p>Todo o conteúdo deste site (textos, imagens, logotipos) é de propriedade da JP Variedades LTDA e está protegido por leis de direitos autorais.</p>

        <h2 className="text-base font-semibold text-foreground">7. Alterações nos Termos</h2>
        <p>Reservamo-nos o direito de alterar estes termos a qualquer momento. As mudanças entram em vigor imediatamente após a publicação.</p>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Última atualização: março de 2026. JP VARIEDADES LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default TermosCondicoes;
