/**
 * @file ProductContext.tsx
 * @description Fornece o contexto global para gerenciar informações do produto selecionado,
 * incluindo variantes, preços, descontos e estado de carregamento.
 */

import { createContext, useContext, useState, ReactNode } from "react";
import { PRODUCT } from "@/data/storeContent";

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
}

/**
 * @constant defaultProduct
 * @description Estado inicial padrão para o produto antes do carregamento.
 */
const defaultProduct: ProductData = {
  id: "",
  title: "Carregando...",
  description: "",
  images: [],
  cart_image: "",
  variants: [{ label: "-", price: 0, oldPrice: 0, stock: 0 }],
  variant_label: "Tamanho",
  rating: 4.6,
  rating_count: 0,
  sold_count: 0,
  default_variant: 0,
  badges: [],
};

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
  /** Indica se os dados estão sendo buscados */
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | null>(null);

/**
 * @component ProductProvider
 * @description Provedor de contexto que busca os dados do produto ativo no Supabase
 * e gerencia o estado da variante selecionada pelo usuário.
 */
export const ProductProvider = ({ children }: { children: ReactNode }) => {
  // Conteúdo local — nenhuma consulta ao banco para exibir o produto.
  const [product] = useState<ProductData>(() => ({ ...PRODUCT, variants: [...PRODUCT.variants] } as ProductData));
  const [selectedSize, setSelectedSize] = useState(() =>
    Math.max(0, Math.min(PRODUCT.default_variant, PRODUCT.variants.length - 1)),
  );
  const loading = false;

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
        priceDisplay: s.price.toFixed(2).replace(".", ","),
        oldPriceDisplay: s.oldPrice.toFixed(2).replace(".", ","),
        sizeLabel: s.label,
        product,
        loading,
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
