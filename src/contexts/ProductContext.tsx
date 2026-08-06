/**
 * @file ProductContext.tsx
 * @description Fornece o contexto global para gerenciar informações do produto selecionado,
 * incluindo variantes, preços, descontos e estado de carregamento.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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
 * @interface Model
 * @description Representa uma variação de modelo/cor do produto.
 */
interface Model {
  /** Nome do modelo/cor */
  name: string;
  /** URL da imagem do modelo */
  image: string;
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
  /** Lista de variantes (ex: tamanhos) disponíveis */
  variants: Variant[];
  /** Lista de modelos (ex: cores) disponíveis */
  models: Model[];
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
  models: [],
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
  /** Índice da variante atualmente selecionada (ex: tamanho) */
  selectedSize: number;
  /** Função para atualizar a variante selecionada */
  setSelectedSize: (i: number) => void;
  /** Índice do modelo atualmente selecionado (ex: cor) */
  selectedModel: number;
  /** Função para atualizar o modelo selecionado */
  setSelectedModel: (i: number) => void;
  /** Lista de todas as variantes (tamanhos) disponíveis */
  sizes: Variant[];
  /** Lista de todos os modelos disponíveis */
  models: Model[];
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
  /** Rótulo do modelo selecionado */
  modelLabel: string;
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
  const [product, setProduct] = useState<ProductData>(defaultProduct);
  const [selectedSize, setSelectedSize] = useState(0);
  const [selectedModel, setSelectedModel] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    /**
     * Carrega os dados do primeiro produto ativo encontrado no banco.
     * Em caso de erro de rede ou banco, mantém o estado padrão para
     * não quebrar a interface e loga o problema no console.
     */
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("[ProductContext] Falha ao carregar produto:", error.message);
          return;
        }

        if (data) {
          const p: ProductData = {
            id: data.id,
            title: data.title,
            description: data.description,
            images: Array.isArray(data.images) ? (data.images as any) : [],
            cart_image: data.cart_image,
            variants: Array.isArray(data.variants) && (data.variants as any).length > 0
              ? (data.variants as any)
              : defaultProduct.variants,
            models: Array.isArray(data.models) ? (data.models as any) : [],
            variant_label: data.variant_label || "Tamanho",
            rating: Number(data.rating) || 0,
            rating_count: Number(data.rating_count) || 0,
            sold_count: Number(data.sold_count) || 0,
            default_variant: Number(data.default_variant) || 0,
            badges: Array.isArray(data.badges) ? (data.badges as any) : [],
          };
          setProduct(p);
          setSelectedSize(Math.max(0, Math.min(p.default_variant, p.variants.length - 1)));
          setSelectedModel(0);
        }
      } catch (err) {
        console.error("[ProductContext] Erro inesperado ao carregar produto:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
        selectedModel,
        setSelectedModel,
        sizes: variants,
        models: product.models,
        price: s.price,
        oldPrice: s.oldPrice,
        discount,
        priceDisplay: s.price.toFixed(2).replace(".", ","),
        oldPriceDisplay: s.oldPrice.toFixed(2).replace(".", ","),
        sizeLabel: s.label,
        modelLabel: product.models[selectedModel]?.name || "",
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
