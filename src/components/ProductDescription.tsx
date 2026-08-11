import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useProduct } from "@/contexts/ProductContext";

/** Lista de destaques de performance exibidos como bullets com ícone de verificação */
const HIGHLIGHTS = [
  "Tecnologia de amortecimento ultra macio",
  "Design anatômico para conforto prolongado",
  "Material resistente de alta durabilidade",
  "Cabedal tecnológico respirável",
];

/**
 * Componente que exibe a descrição detalhada do produto,
 * os destaques de performance e a tabela de tamanhos.
 */
const ProductDescription = () => {
  const { product } = useProduct();

  // Divide a descrição em parágrafos e itens de check
  const lines = product.description.split("\n").map(l => l.trim()).filter(Boolean);
  const bodyText = lines.filter(l => !l.startsWith("✔") && !l.startsWith("•")).join(" ");
  const listItems = lines.filter(l => l.startsWith("✔") || l.startsWith("•")).map(l => l.substring(1).trim());

  return (
    <>
      {/* Seção de Descrição */}
      <section className="border-t border-border py-10 px-4 sm:px-0">
        <h2 className="text-2xl font-extrabold text-foreground mb-1">Descrição</h2>
        <p className="text-sm text-muted-foreground mb-6">Versatilidade e segurança para seu trabalho</p>

        {bodyText && <p className="text-sm text-foreground/80 leading-relaxed mb-6">{bodyText}</p>}

        {listItems.length > 0 && (
          <>
            <h3 className="text-lg font-bold text-foreground mb-3">Destaques do Produto</h3>
            <ul className="space-y-2.5 mb-6">
              {listItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Produto original Minas Escadas / Qualidade garantida.</span>
        </div>
      </section>

      {/* Seção de Tabela de Tamanhos */}
      <section id="especificacoes" className="border-t border-border py-10 scroll-mt-24 px-4 sm:px-0">
        <h2 className="text-2xl font-extrabold text-foreground mb-6">Especificações Técnicas</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-muted rounded-lg">
            <span className="block text-muted-foreground text-xs uppercase font-bold mb-1">Material</span>
            <span className="font-semibold">Alumínio</span>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <span className="block text-muted-foreground text-xs uppercase font-bold mb-1">Marca</span>
            <span className="font-semibold">Charbs</span>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <span className="block text-muted-foreground text-xs uppercase font-bold mb-1">Capacidade</span>
            <span className="font-semibold">150kg</span>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <span className="block text-muted-foreground text-xs uppercase font-bold mb-1">Degraus</span>
            <span className="font-semibold">16 Degraus</span>
          </div>
        </div>
      </section>
    </>
  );
};

export default ProductDescription;
