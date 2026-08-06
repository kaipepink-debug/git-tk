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

  // Remove marcações de markdown simples para obter um parágrafo de texto corrido
  const bodyText = product.description
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("✔") && !l.startsWith("•") && !l.startsWith("**"))
    .join(" ")
    .replace(/\*\*/g, "");

  return (
    <>
      {/* Seção de Descrição */}
      <section className="border-t border-border py-10 px-4 sm:px-0">
        <h2 className="text-2xl font-extrabold text-foreground mb-1">Descrição</h2>
        <p className="text-sm text-muted-foreground mb-6">Conforto e tecnologia para o seu dia a dia</p>

        {product.images[1] && (
          <img
            src={product.images[1]}
            alt={`Detalhe de ${product.title}`}
            className="w-full max-h-[420px] object-cover rounded-2xl mb-6"
            loading="lazy"
          />
        )}

        {bodyText && <p className="text-sm text-foreground/80 leading-relaxed mb-6">{bodyText}</p>}

        <h3 className="text-lg font-bold text-foreground mb-3">Destaques de Performance</h3>
        <ul className="space-y-2.5 mb-6">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/80">
              <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">Produto original Chiqueb / Qualidade garantida.</span>
        </div>
      </section>

      {/* Seção de Tabela de Tamanhos */}
      <section id="tabela-tamanhos" className="border-t border-border py-10 scroll-mt-24 px-4 sm:px-0">
        <h2 className="text-2xl font-extrabold text-foreground mb-6">Tabela de Tamanhos</h2>
        <img
          src="https://chiquebloja.com/cdn/shop/files/D_Q_NP_945111-CBT110725393957_042026-B-tnis-de-corrida-responsivos-leves-e-confortaveis-tamanhos.webp"
          alt="Tabela de tamanhos Zyro"
          className="w-full rounded-2xl mb-6"
          loading="lazy"
        />
        <h3 className="text-lg font-bold text-foreground mb-3">Encontre seu tamanho</h3>
        <ol className="space-y-2 list-decimal list-inside text-sm text-foreground/80">
          <li>Meça a palmilha de um tênis que você já usa e goste do caimento.</li>
          <li>Anote o comprimento em centímetros.</li>
          <li>Compare a medida com a tabela acima para encontrar seu tamanho ideal.</li>
        </ol>
      </section>
    </>
  );
};

export default ProductDescription;
