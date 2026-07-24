import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const QuemSomos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Quem Somos</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>
          Somos a <strong className="text-foreground">JP Variedades LTDA</strong>, uma empresa 100% brasileira focada em oferecer variedade, qualidade e preço justo aos nossos clientes.
        </p>
        <p>
          Nossa equipe é formada por profissionais apaixonados pelo que fazem, sempre buscando as melhores oportunidades e produtos para você. Acreditamos que comprar online deve ser simples, seguro e prazeroso.
        </p>
        <p>
          Valorizamos cada cliente e trabalhamos incansavelmente para superar suas expectativas. Desde a seleção dos produtos até a entrega na sua porta, cada etapa é cuidadosamente planejada.
        </p>
        <h2 className="text-base font-semibold text-foreground pt-2">Nossos Valores</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Compromisso com a qualidade</li>
          <li>Transparência em todas as relações</li>
          <li>Respeito ao consumidor</li>
          <li>Preços justos e acessíveis</li>
          <li>Atendimento humanizado</li>
        </ul>
        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          JP VARIEDADES LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default QuemSomos;
