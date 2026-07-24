import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Variant {
  label: string;
  price: number;
  oldPrice: number;
  stock: number;
}

interface ProductData {
  id: string;
  title: string;
  description: string;
  images: string[];
  cart_image: string;
  variants: Variant[];
  variant_label: string;
  rating: number;
  rating_count: number;
  sold_count: number;
  default_variant: number;
  badges: string[];
}

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

interface ProductContextType {
  selectedSize: number;
  setSelectedSize: (i: number) => void;
  sizes: Variant[];
  price: number;
  oldPrice: number;
  discount: number;
  priceDisplay: string;
  oldPriceDisplay: string;
  sizeLabel: string;
  product: ProductData;
  loading: boolean;
}

const ProductContext = createContext<ProductContextType | null>(null);

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [product, setProduct] = useState<ProductData>(defaultProduct);
  const [selectedSize, setSelectedSize] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      if (data) {
        const p: ProductData = {
          id: data.id,
          title: data.title,
          description: data.description,
          images: (data.images as any) || [],
          cart_image: data.cart_image,
          variants: (data.variants as any) || [],
          variant_label: data.variant_label,
          rating: Number(data.rating),
          rating_count: data.rating_count,
          sold_count: data.sold_count,
          default_variant: data.default_variant,
          badges: (data.badges as any) || [],
        };
        setProduct(p);
        setSelectedSize(p.default_variant);
      }
      setLoading(false);
    };
    load();
  }, []);

  const variants = product.variants;
  const s = variants[selectedSize] || variants[0] || { price: 0, oldPrice: 0, label: "-", stock: 0 };
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

export const useProduct = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProduct must be used within ProductProvider");
  return ctx;
};
