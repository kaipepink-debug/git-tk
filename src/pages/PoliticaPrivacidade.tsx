/**
 * Rota: /politica-privacidade
 * Propósito: Página detalhando como a loja coleta, utiliza e protege os dados pessoais
 * dos usuários, garantindo transparência e conformidade com a LGPD.
 */

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Componente da página Política de Privacidade.
 */
const PoliticaPrivacidade = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Política de Privacidade</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>A JP Variedades LTDA valoriza a sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais.</p>

        <h2 className="text-base font-semibold text-foreground">1. Informações Coletadas</h2>
        <p>Coletamos informações fornecidas diretamente por você, como nome, e-mail, CPF, telefone e endereço de entrega ao realizar uma compra. Também coletamos dados de navegação automaticamente, como endereço IP, tipo de navegador e páginas visitadas.</p>

        <h2 className="text-base font-semibold text-foreground">2. Uso das Informações</h2>
        <p>Suas informações são utilizadas para processar pedidos, enviar comunicações sobre seus pedidos, melhorar nossos serviços e cumprir obrigações legais.</p>

        <h2 className="text-base font-semibold text-foreground">3. Compartilhamento</h2>
        <p>Não vendemos suas informações pessoais. Compartilhamos dados apenas com parceiros necessários para a operação (transportadoras, gateways de pagamento) e quando exigido por lei.</p>

        <h2 className="text-base font-semibold text-foreground">4. Segurança</h2>
        <p>Utilizamos criptografia SSL e seguimos as melhores práticas de segurança para proteger seus dados contra acesso não autorizado.</p>

        <h2 className="text-base font-semibold text-foreground">5. Seus Direitos (LGPD)</h2>
        <p>Você tem direito a acessar, corrigir, excluir seus dados pessoais ou solicitar a portabilidade. Para exercer seus direitos, entre em contato pelo e-mail monstereletric@gmail.com.</p>

        <h2 className="text-base font-semibold text-foreground">6. Cookies</h2>
        <p>Utilizamos cookies para melhorar sua experiência de navegação. Consulte nossa Política de Cookies para mais detalhes.</p>

        <h2 className="text-base font-semibold text-foreground">7. Publicidade e Medição (TikTok)</h2>
        <p>Utilizamos o Pixel do TikTok e a API de Eventos do TikTok (TikTok Pte. Ltd.) para medir e otimizar nossos anúncios. São compartilhados com o TikTok dados de navegação e de compra: páginas visitadas, endereço IP, identificadores de cookie/navegador, itens visualizados ou adicionados ao carrinho, valor e moeda do pedido e confirmação de pagamento. Quando você autoriza, também podem ser enviados e-mail e telefone de forma criptografada (hash), apenas para correspondência de conversões.</p>
        <p>As finalidades são: medição dos resultados das campanhas e otimização/segmentação de anúncios. Em regiões que exigem consentimento prévio (União Europeia, Reino Unido e Suíça), esse envio só ocorre após o seu aceite no aviso de cookies, e você pode recusar ou mudar sua escolha a qualquer momento pelo mesmo aviso. Nas demais regiões, incluindo o Brasil, você pode solicitar a interrupção do uso dos seus dados para publicidade pelo e-mail monstereletric@gmail.com, além de exercer os direitos previstos na LGPD descritos no item 5.</p>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Última atualização: março de 2026. MONSTER MOBILIDADE LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
