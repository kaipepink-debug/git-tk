import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const RastreamentoPedido = () => {
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<string | null>(null);

  const handleRastrear = () => {
    if (!codigo.trim()) return;
    setResultado("Não foi possível localizar o pedido com o código informado. Verifique o código e tente novamente, ou entre em contato com nosso suporte.");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Rastreamento de Pedido</h1>
      </div>

      <div className="px-4 py-6 space-y-4 text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
        <p>Informe o código de rastreamento que você recebeu por e-mail para acompanhar seu pedido:</p>

        <div className="space-y-3">
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Digite o código de rastreamento"
            className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button onClick={handleRastrear} className="w-full">
            Rastrear Pedido
          </Button>
        </div>

        {resultado && (
          <div className="p-3 rounded-md border border-border bg-muted text-sm text-muted-foreground">
            {resultado}
          </div>
        )}

        <h2 className="text-base font-semibold text-foreground pt-2">Precisa de ajuda?</h2>
        <p>Se tiver dificuldades para rastrear seu pedido, entre em contato pelo e-mail <strong className="text-foreground">contato@JPvariedadesltda.com.br</strong> ou pelo telefone <strong className="text-foreground">(89) 98102-5918</strong>.</p>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          JP VARIEDADES LTDA — CNPJ: 64.482.958/0001-00
        </p>
      </div>
    </div>
  );
};

export default RastreamentoPedido;
