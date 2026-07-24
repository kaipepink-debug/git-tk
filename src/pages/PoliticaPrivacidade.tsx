import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
        <p>Você tem direito a acessar, corrigir, excluir seus dados pessoais ou solicitar a portabilidade. Para exercer seus direitos, entre em contato pelo e-mail contato@JPvariedadesltda.com.br.</p>

        <h2 className="text-base font-semibold text-foreground">6. Cookies</h2>
        <p>Utilizamos cookies para melhorar sua experiência de navegação. Consulte nossa Política de Cookies para mais detalhes.</p>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          Última atualização: março de 2026. JP VARIEDADES LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
