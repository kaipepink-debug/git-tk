/**
 * @file ProductContext.tsx
 * @description Fornece o contexto global para gerenciar informações do produto selecionado,
 * incluindo variantes, preços, descontos e estado de carregamento.
 */

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { PRODUCTS, type StoreProduct } from "@/data/storeContent";
import { carregaCatalogo, SLUG_VALIDO } from "@/lib/catalogo";
import { definePixelId } from "@/lib/tracking/tiktok";

/**
 * @interface Variant
 * @description Representa uma variante específica de um produto (ex: tamanho, cor).
 */
interface Variant {
  /** Rótulo da variante (ex: "P", "M", "G") */
  label: string;
  /** Preço atual da variante */
  price: number;
  /** Preço original (sem desconto) para exibição */
  oldPrice: number;
  /** Quantidade em estoque */
  stock: number;
  /** Prazo próprio da versão (pronta entrega × sob encomenda) */
  delivery?: string;
}

/**
 * @interface ProductData
 * @description Estrutura completa dos dados de um produto vindos do banco de dados.
 */
interface ProductData {
  /** Identificador único do produto */
  id: string;
  /** Título/nome do produto */
  title: string;
  /** Descrição detalhada */
  description: string;
  /** Lista de URLs das imagens do produto */
  images: string[];
  /** URL da imagem simplificada para o carrinho */
  cart_image: string;
  /** Lista de variantes disponíveis */
  variants: Variant[];
  /** Rótulo para o seletor de variantes (ex: "Tamanho") */
  variant_label: string;
  /** Avaliação média (0 a 5) */
  rating: number;
  /** Total de avaliações */
  rating_count: number;
  /** Total de unidades vendidas */
  sold_count: number;
  /** Índice da variante padrão selecionada */
  default_variant: number;
  /** Badges ou etiquetas promocionais */
  badges: string[];
  /** Endereço da página do produto ("produto", "buggy") */
  slug: string;
  /** Mostra nota e "vendidos" — só onde existem de verdade */
  social_proof: boolean;
  /** Oferece os adicionais do carrinho */
  bumps: boolean;
  /** Pode receber a oferta de saída */
  exit_offer: boolean;
  /** Texto de entrega; vazio usa a estimativa padrão */
  delivery_text: string;
  /** Itens da "Proteção do cliente" */
  protection: string[];
}

/**
 * @interface ProductContextType
 * @description Define a estrutura do valor exposto pelo contexto de produto.
 */
interface ProductContextType {
  /** Índice da variante atualmente selecionada */
  selectedSize: number;
  /** Função para atualizar a variante selecionada */
  setSelectedSize: (i: number) => void;
  /** Lista de todas as variantes (tamanhos) disponíveis */
  sizes: Variant[];
  /** Preço da variante selecionada */
  price: number;
  /** Preço antigo da variante selecionada */
  oldPrice: number;
  /** Percentual de desconto calculado */
  discount: number;
  /** Preço formatado para exibição (ex: "99,90") */
  priceDisplay: string;
  /** Preço antigo formatado para exibição */
  oldPriceDisplay: string;
  /** Rótulo da variante selecionada */
  sizeLabel: string;
  /** Dados completos do produto */
  product: ProductData;
  /** true enquanto o catálogo do banco ainda não chegou */
  loading: boolean;
  /** O produto pedido existe (no banco ou no código de reserva) */
  encontrado: boolean;
  /** Troca o produto ativo — chamado pela página de cada produto */
  setActiveSlug: (slug: string) => void;
}

/** 24990 → "24.990,00"; 89.75 → "89,75". */
const brl = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ProductContext = createContext<ProductContextType | null>(null);

/**
 * @component ProductProvider
 * @description Provedor de contexto que busca os dados do produto ativo no Supabase
 * e gerencia o estado da variante selecionada pelo usuário.
 */
export const ProductProvider = ({ children }: { children: ReactNode }) => {
  // O catálogo nasce do código (reserva) e é trocado pelo do banco assim que
  // ele chega — é o banco que o painel /admin edita e que o Pix cobra.
  const [catalogo, setCatalogo] = useState<Record<string, StoreProduct>>(PRODUCTS);
  const catalogoRef = useRef(catalogo);
  catalogoRef.current = catalogo;
  const [loading, setLoading] = useState(true);

  // O produto ativo fica na sessão: o carrinho e o checkout não têm endereço
  // próprio de produto, então precisam lembrar de qual página o cliente veio.
  const [activeSlug, setActiveSlugState] = useState(() => {
    try {
      const salvo = sessionStorage.getItem("produto_ativo");
      return salvo && SLUG_VALIDO.test(salvo) ? salvo : "produto";
    } catch {
      return "produto";
    }
  });
  const encontrado = Boolean(catalogo[activeSlug]);
  const product = (catalogo[activeSlug] ?? catalogo.produto ?? PRODUCTS.produto) as unknown as ProductData;

  // A versão escolhida também fica na sessão, por produto: recarregar o
  // carrinho não pode trocar a versão que o cliente escolheu.
  const versaoSalva = (slug: string) => {
    const p = catalogoRef.current[slug] ?? PRODUCTS.produto;
    try {
      const v = Number(sessionStorage.getItem(`versao_${slug}`));
      if (Number.isInteger(v) && v >= 0 && v < p.variants.length) return v;
    } catch { /* sem sessão */ }
    return Math.max(0, Math.min(p.default_variant, p.variants.length - 1));
  };
  const [selectedSize, setSelectedSizeState] = useState(() => versaoSalva(activeSlug));
  const setSelectedSize = useCallback((i: number) => {
    setSelectedSizeState(i);
    try { sessionStorage.setItem(`versao_${activeSlug}`, String(i)); } catch { /* sem sessão */ }
  }, [activeSlug]);
  const setActiveSlug = useCallback((slug: string) => {
    if (!SLUG_VALIDO.test(slug)) return;
    try { sessionStorage.setItem("produto_ativo", slug); } catch { /* sem sessão: vale só nesta página */ }
    setActiveSlugState((atual) => {
      if (atual !== slug) setSelectedSizeState(versaoSalva(slug));
      return slug;
    });
  // versaoSalva lê o catálogo pela ref, então não precisa entrar aqui
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let vivo = true;
    carregaCatalogo().then((r) => {
      if (!vivo) return;
      if (r) {
        // Produto do código que o painel desativou some da vitrine também.
        setCatalogo(r.produtos);
        definePixelId(r.pixel);
      } else {
        definePixelId(null);
      }
      setLoading(false);
    });
    return () => { vivo = false; };
  }, []);

  // A versão salva pode não existir mais se o painel tirou versões.
  useEffect(() => {
    const p = catalogo[activeSlug];
    if (p && selectedSize >= p.variants.length) setSelectedSizeState(0);
  }, [catalogo, activeSlug, selectedSize]);

  const variants = product.variants;
  // Obtém a variante selecionada ou cai para a primeira disponível
  const s = variants[selectedSize] || variants[0] || { price: 0, oldPrice: 0, label: "-", stock: 0 };
  
  // Cálculo do percentual de desconto
  const discount = s.oldPrice > 0 ? Math.round((1 - s.price / s.oldPrice) * 100) : 0;

  return (
    <ProductContext.Provider
      value={{
        selectedSize,
        setSelectedSize,
        sizes: variants,
        price: s.price,
        oldPrice: s.oldPrice,
        discount,
        priceDisplay: brl(s.price),
        oldPriceDisplay: brl(s.oldPrice),
        sizeLabel: s.label,
        product,
        loading,
        encontrado,
        setActiveSlug,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

/**
 * @hook useProduct
 * @description Hook de conveniência para acessar o contexto de produto.
 * @throws {Error} Lança um erro se for usado fora de um ProductProvider.
 * @returns {ProductContextType} Os dados e funções do contexto de produto.
 */
export const useProduct = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProduct must be used within ProductProvider");
  return ctx;
};
