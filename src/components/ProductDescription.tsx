import { useProduct } from "@/contexts/ProductContext";

/**
 * Componente que exibe a descrição detalhada do produto.
 * Processa texto em formato markdown-like simples, suportando:
 * - Seções separadas por '---'
 * - Títulos em negrito (**texto**)
 * - Listas com marcadores (✔ ou •)
 * - Formatação de descrição com travessão (—)
 */
const ProductDescription = () => {
  const { product } = useProduct();

  // Divide a descrição em seções maiores usando o separador ---
  const sections = product.description.split("---").map(s => s.trim()).filter(Boolean);

  return (
    <div className="bg-background px-4 py-4 mt-2">
      <h3 className="text-base font-bold text-foreground mb-3">Descrição</h3>
      <div className="text-sm text-foreground/80 space-y-4 leading-relaxed">
        {sections.map((section, i) => {
          const lines = section.split("\n").filter(l => l.trim());
          return (
            <div key={i} className={i > 0 ? "border-t border-border pt-4" : ""}>
              {lines.map((line, j) => {
                const trimmed = line.trim();
                
                // Cabeçalhos em negrito: **texto**
                if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
                  return <p key={j} className="font-semibold text-foreground mb-2">{trimmed.replace(/\*\*/g, "")}</p>;
                }
                
                // Itens de lista com checkmarks ou bullets
                if (trimmed.startsWith("✔") || trimmed.startsWith("•")) {
                  const parts = trimmed.replace(/^\*\*/, "").replace(/\*\*$/, "");
                  const dashIdx = parts.indexOf("—");
                  
                  // Formatação especial para itens com descrição após travessão
                  if (dashIdx > -1) {
                    return (
                      <li key={j} className="list-none">
                        <strong>{parts.substring(0, dashIdx).trim()}</strong>
                        <br />{parts.substring(dashIdx + 1).trim()}
                      </li>
                    );
                  }
                  return <li key={j} className="list-none">{parts}</li>;
                }
                
                // Parágrafo regular - trata negrito inline usando regex e dangerouslySetInnerHTML
                const html = trimmed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
                return <p key={j} dangerouslySetInnerHTML={{ __html: html }} />;
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductDescription;
