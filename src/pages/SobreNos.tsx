import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SobreNos = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Sobre Nós</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>
          A <strong className="text-foreground">JP Variedades LTDA</strong> é uma empresa brasileira dedicada a oferecer produtos de alta qualidade com os melhores preços do mercado.
        </p>
        <p>
          Nascemos com o propósito de facilitar o dia a dia das pessoas, trazendo soluções práticas e acessíveis para o lar e o trabalho. Nossa missão é garantir que cada cliente tenha uma experiência de compra segura, rápida e satisfatória.
        </p>
        <p>
          Trabalhamos com fornecedores rigorosamente selecionados para garantir a procedência e durabilidade de todos os nossos produtos. Cada item passa por um controle de qualidade antes de ser enviado ao cliente.
        </p>
        <p>
          Estamos comprometidos com a transparência, a honestidade e o respeito ao consumidor. Se você tiver qualquer dúvida ou sugestão, entre em contato conosco pelo e-mail <strong className="text-foreground">contato@JPvariedadesltda.com.br</strong> ou pelo telefone <strong className="text-foreground">(89) 98102-5918</strong>.
        </p>
        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          JP VARIEDADES LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default SobreNos;
