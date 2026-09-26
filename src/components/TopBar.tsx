import { ArrowLeft, Search, User, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Componente de barra superior (Header) da página de produto.
 * Contém botão de voltar, barra de pesquisa (estilizada), link para conta e carrinho.
 */
const TopBar = () => {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-50 bg-background flex items-center gap-2 px-3 py-2 border-b border-border">
      {/* Botão de Voltar */}
      <button
        className="p-1 text-foreground"
        aria-label="Voltar"
        onClick={() => window.dispatchEvent(new Event("exit-intent-back"))}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Barra de Pesquisa (atualmente um elemento visual estático) */}
      <div className="flex-1 flex items-center bg-secondary rounded-full px-3 py-1.5 gap-2">
        <Search className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Pesquisar</span>
      </div>

      {/* Link para Minha Conta */}
      <button className="p-1 text-foreground" onClick={() => navigate("/minha-conta")}>
        <User className="w-5 h-5" />
      </button>

      {/* Botão de Carrinho */}
      <button className="p-1 text-foreground">
        <ShoppingCart className="w-5 h-5" />
      </button>
    </div>
  );
};

export default TopBar;
