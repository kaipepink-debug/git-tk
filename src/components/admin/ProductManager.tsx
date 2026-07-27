/**
 * @file ProductManager.tsx
 * @description Componente central para gerenciamento do produto principal, incluindo informações básicas, galeria de imagens, variantes de preço/estoque, descrição e avaliações de clientes.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Image as ImageIcon, Tag, FileText, Star, Plus, Trash2, Save, Loader2,
  CheckCircle, GripVertical, Upload, X
} from "lucide-react";

/**
 * @interface Variant
 * @description Estrutura de uma variante de produto (ex: tamanho, modelo).
 */
interface Variant {
  label: string;
  price: number;
  oldPrice: number;
  stock: number;
}

/**
 * @interface ProductData
 * @description Estrutura completa dos dados de um produto.
 */
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

/**
 * @interface ReviewData
 * @description Estrutura de uma avaliação de cliente.
 */
interface ReviewData {
  id: string;
  reviewer_name: string;
  reviewer_initial: string;
  avatar_url: string | null;
  rating: number;
  review_text: string;
  photos: string[];
  days_ago: number;
  display_order: number;
}

// Estilos de classe reutilizáveis para manter a consistência do layout admin
const inputClass = "w-full px-3 py-2.5 rounded-lg bg-[hsl(220,20%,7%)] border border-[hsl(220,15%,18%)] text-white text-[11px] outline-none focus:border-[hsl(14,100%,55%)] transition-colors";
const labelClass = "text-[10px] text-[hsl(220,10%,45%)] block mb-1.5 uppercase tracking-wider font-medium";
const btnPrimary = "py-2.5 px-4 rounded-lg bg-gradient-to-r from-[hsl(14,100%,55%)] to-[hsl(14,100%,45%)] text-white text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[hsl(14,100%,30%)]/15";
const cardClass = "bg-[hsl(220,20%,11%)] border border-[hsl(220,15%,16%)] rounded-xl overflow-hidden";
const headerClass = "px-5 py-4 border-b border-[hsl(220,15%,14%)] flex items-center gap-3";

/**
 * @component ProductManager
 * @description Interface administrativa completa para edição do produto e seus depoimentos.
 */
const ProductManager = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsSaving, setReviewsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<"basic" | "images" | "variants" | "description" | "reviews">("basic");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Carrega os dados do produto ativo ao iniciar
  useEffect(() => {
    loadProduct();
  }, []);

  /**
   * Busca os dados do produto e suas avaliações no banco de dados.
   */
  const loadProduct = async () => {
    const { data: pData } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (pData) {
      setProduct({
        id: pData.id,
        title: pData.title,
        description: pData.description,
        images: (pData.images as any) || [],
        cart_image: pData.cart_image,
        variants: (pData.variants as any) || [],
        variant_label: pData.variant_label,
        rating: Number(pData.rating),
        rating_count: pData.rating_count,
        sold_count: pData.sold_count,
        default_variant: pData.default_variant,
        badges: (pData.badges as any) || [],
      });

      const { data: rData } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", pData.id)
        .order("display_order", { ascending: true });

      if (rData) {
        setReviews(rData.map(r => ({ ...r, photos: (r.photos as any) || [] })));
      }
    }
    setLoading(false);
  };

  /**
   * Salva as alterações principais do produto no banco de dados.
   */
  const saveProduct = async () => {
    if (!product) return;
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({
        title: product.title,
        description: product.description,
        images: product.images as any,
        cart_image: product.cart_image,
        variants: product.variants as any,
        variant_label: product.variant_label,
        rating: product.rating,
        rating_count: product.rating_count,
        sold_count: product.sold_count,
        default_variant: product.default_variant,
        badges: product.badges as any,
      })
      .eq("id", product.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto salvo com sucesso!" });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  /**
   * Salva as avaliações dos clientes, deletando as antigas e inserindo as novas ordens.
   */
  const saveReviews = async () => {
    if (!product) return;
    setReviewsSaving(true);

    // Remove todas as avaliações existentes para substituir pela nova lista (sincronização total)
    await supabase.from("product_reviews").delete().eq("product_id", product.id);

    if (reviews.length > 0) {
      const { error } = await supabase.from("product_reviews").insert(
        reviews.map((r, i) => ({
          product_id: product.id,
          reviewer_name: r.reviewer_name,
          reviewer_initial: r.reviewer_initial,
          avatar_url: r.avatar_url,
          rating: r.rating,
          review_text: r.review_text,
          photos: r.photos as any,
          days_ago: r.days_ago,
          display_order: i + 1,
        }))
      );
      if (error) {
        toast({ title: "Erro ao salvar avaliações", description: error.message, variant: "destructive" });
        setReviewsSaving(false);
        return;
      }
    }

    toast({ title: "Avaliações salvas!" });
    setReviewsSaving(false);
    // Recarrega para obter os novos IDs gerados
    if (product) {
      const { data } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", product.id)
        .order("display_order", { ascending: true });
      if (data) setReviews(data.map(r => ({ ...r, photos: (r.photos as any) || [] })));
    }
  };

  /**
   * Gerencia o upload de imagens para o Supabase Storage.
   */
  const handleImageUpload = async (file: File) => {
    if (!product) return;
    setUploadingImage(true);
    const ext = file.name.split(".").pop();
    const path = `${product.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploadingImage(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setProduct({ ...product, images: [...product.images, urlData.publicUrl] });
    setUploadingImage(false);
  };

  /**
   * Adiciona uma URL de imagem externa à galeria.
   */
  const addImageUrl = () => {
    if (!product || !newImageUrl.trim()) return;
    setProduct({ ...product, images: [...product.images, newImageUrl.trim()] });
    setNewImageUrl("");
  };

  /**
   * Remove uma imagem da galeria.
   */
  const removeImage = (idx: number) => {
    if (!product) return;
    setProduct({ ...product, images: product.images.filter((_, i) => i !== idx) });
  };

  /**
   * Atualiza os campos de uma variante específica.
   */
  const updateVariant = (idx: number, field: keyof Variant, value: any) => {
    if (!product) return;
    const v = [...product.variants];
    v[idx] = { ...v[idx], [field]: field === "label" ? value : Number(value) };
    setProduct({ ...product, variants: v });
  };

  /**
   * Adiciona uma nova variante de preço/estoque.
   */
  const addVariant = () => {
    if (!product) return;
    setProduct({ ...product, variants: [...product.variants, { label: "", price: 0, oldPrice: 0, stock: 10 }] });
  };

  /**
   * Remove uma variante.
   */
  const removeVariant = (idx: number) => {
    if (!product) return;
    const v = product.variants.filter((_, i) => i !== idx);
    // BUGFIX: quando v.length = 0, o cálculo anterior gerava default_variant = -1
    const nextDefault = v.length > 0 ? Math.min(product.default_variant, v.length - 1) : 0;
    setProduct({ ...product, variants: v, default_variant: Math.max(0, nextDefault) });
  };

  /**
   * Adiciona uma nova avaliação vazia para preenchimento.
   */
  const addReview = () => {
    setReviews([...reviews, {
      id: `new-${Date.now()}`,
      reviewer_name: "",
      reviewer_initial: "",
      avatar_url: null,
      rating: 5,
      review_text: "",
      photos: [],
      days_ago: 1,
      display_order: reviews.length + 1,
    }]);
  };

  /**
   * Atualiza os campos de um depoimento.
   */
  const updateReview = (idx: number, field: string, value: any) => {
    const r = [...reviews];
    (r[idx] as any)[field] = value;
    if (field === "reviewer_name" && value) {
      r[idx].reviewer_initial = value.charAt(0).toUpperCase();
    }
    setReviews(r);
  };

  /**
   * Remove um depoimento.
   */
  const removeReview = (idx: number) => {
    setReviews(reviews.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(220,10%,40%)]" />
      </div>
    );
  }

  if (!product) {
    return <p className="text-[hsl(220,10%,40%)] text-sm">Nenhum produto encontrado.</p>;
  }

  const sections = [
    { key: "basic" as const, label: "Informações", icon: Package },
    { key: "images" as const, label: "Imagens", icon: ImageIcon },
    { key: "variants" as const, label: "Variantes", icon: Tag },
    { key: "description" as const, label: "Descrição", icon: FileText },
    { key: "reviews" as const, label: "Avaliações", icon: Star },
  ];

  return (
    <div className="max-w-4xl space-y-4">
      {/* Abas das seções do gerenciador */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {sections.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
              activeSection === s.key
                ? "bg-[hsl(14,100%,55%)] text-white"
                : "bg-[hsl(220,20%,11%)] text-[hsl(220,10%,45%)] hover:text-white"
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Seção: Informações Básicas */}
      {activeSection === "basic" && (
        <div className={cardClass}>
          <div className={headerClass}>
            <div className="w-9 h-9 rounded-lg bg-[hsl(14,80%,10%)] flex items-center justify-center">
              <Package className="w-4 h-4 text-[hsl(14,100%,55%)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Informações do Produto</h3>
              <p className="text-[10px] text-[hsl(220,10%,40%)]">Título, avaliação, vendas e badges</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className={labelClass}>Título do Produto</label>
              <input
                value={product.title}
                onChange={e => setProduct({ ...product, title: e.target.value })}
                className={inputClass}
                placeholder="Nome do produto"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Avaliação</label>
                <input type="number" step="0.1" min="0" max="5" value={product.rating}
                  onChange={e => setProduct({ ...product, rating: Number(e.target.value) })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nº Avaliações</label>
                <input type="number" value={product.rating_count}
                  onChange={e => setProduct({ ...product, rating_count: Number(e.target.value) })}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Vendidos</label>
                <input type="number" value={product.sold_count}
                  onChange={e => setProduct({ ...product, sold_count: Number(e.target.value) })}
                  className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Badges (separados por vírgula)</label>
              <input
                value={product.badges.join(", ")}
                onChange={e => setProduct({ ...product, badges: e.target.value.split(",").map(b => b.trim()).filter(Boolean) })}
                className={inputClass}
                placeholder="50% OFF, Top 1° Mais Vendidos"
              />
            </div>
            <button onClick={saveProduct} disabled={saving} className={`w-full ${btnPrimary}`}>
              {saving ? "Salvando..." : saved ? (
                <span className="flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Salvo</span>
              ) : "Salvar Informações"}
            </button>
          </div>
        </div>
      )}

      {/* Seção: Imagens */}
      {activeSection === "images" && (
        <div className={cardClass}>
          <div className={headerClass}>
            <div className="w-9 h-9 rounded-lg bg-[hsl(210,80%,10%)] flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-[hsl(210,100%,65%)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Imagens do Produto</h3>
              <p className="text-[10px] text-[hsl(220,10%,40%)]">Fotos do carrossel e do carrinho</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className={labelClass}>Imagem do Carrinho / Checkout</label>
              <input
                value={product.cart_image}
                onChange={e => setProduct({ ...product, cart_image: e.target.value })}
                className={inputClass}
                placeholder="URL da imagem do carrinho"
              />
              {product.cart_image && (
                <img src={product.cart_image} alt="Cart" className="w-16 h-16 rounded mt-2 object-cover bg-[hsl(220,20%,7%)]" />
              )}
            </div>

            <div>
              <label className={labelClass}>Galeria de Imagens</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {product.images.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="w-full aspect-square rounded-lg object-cover bg-[hsl(220,20%,7%)]" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">{i + 1}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-2">
                <input
                  value={newImageUrl}
                  onChange={e => setNewImageUrl(e.target.value)}
                  className={`flex-1 ${inputClass}`}
                  placeholder="Cole a URL da imagem"
                  onKeyDown={e => e.key === "Enter" && addImageUrl()}
                />
                <button onClick={addImageUrl} className="px-3 py-2 rounded-lg bg-[hsl(220,20%,14%)] border border-[hsl(220,15%,20%)] text-[11px] text-white hover:bg-[hsl(220,20%,18%)]">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <label className="flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-[hsl(220,15%,20%)] cursor-pointer hover:border-[hsl(14,100%,55%)] transition-colors">
                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-[hsl(14,100%,55%)]" /> : <Upload className="w-4 h-4 text-[hsl(220,10%,40%)]" />}
                <span className="text-[11px] text-[hsl(220,10%,40%)]">{uploadingImage ? "Enviando..." : "Upload de imagem"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
              </label>
            </div>

            <button onClick={saveProduct} disabled={saving} className={`w-full ${btnPrimary}`}>
              {saving ? "Salvando..." : "Salvar Imagens"}
            </button>
          </div>
        </div>
      )}

      {/* Seção: Variantes */}
      {activeSection === "variants" && (
        <div className={cardClass}>
          <div className={headerClass}>
            <div className="w-9 h-9 rounded-lg bg-[hsl(150,80%,10%)] flex items-center justify-center">
              <Tag className="w-4 h-4 text-[hsl(150,80%,55%)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Variantes do Produto</h3>
              <p className="text-[10px] text-[hsl(220,10%,40%)]">Tamanhos, cores ou outras variações</p>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Nome da Categoria</label>
                <input
                  value={product.variant_label}
                  onChange={e => setProduct({ ...product, variant_label: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Tamanho, Cor, Modelo"
                />
              </div>
              <div>
                <label className={labelClass}>Variante Padrão</label>
                <select
                  value={product.default_variant}
                  onChange={e => setProduct({ ...product, default_variant: Number(e.target.value) })}
                  className={inputClass}
                >
                  {product.variants.map((v, i) => (
                    <option key={i} value={i}>{v.label || `Variante ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {product.variants.map((v, i) => (
                <div key={i} className="bg-[hsl(220,20%,8%)] rounded-lg p-3 border border-[hsl(220,15%,14%)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[hsl(220,10%,50%)]">Variante {i + 1}</span>
                    <button onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className={labelClass}>Nome</label>
                      <input value={v.label} onChange={e => updateVariant(i, "label", e.target.value)} className={inputClass} placeholder="3.5m" />
                    </div>
                    <div>
                      <label className={labelClass}>Preço (R$)</label>
                      <input type="number" step="0.01" value={v.price} onChange={e => updateVariant(i, "price", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Preço Antigo</label>
                      <input type="number" step="0.01" value={v.oldPrice} onChange={e => updateVariant(i, "oldPrice", e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Estoque</label>
                      <input type="number" value={v.stock} onChange={e => updateVariant(i, "stock", e.target.value)} className={inputClass} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addVariant} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[hsl(220,20%,14%)] border border-[hsl(220,15%,20%)] text-[11px] text-[hsl(220,10%,55%)] hover:text-white transition-colors">
              <Plus className="w-3.5 h-3.5" /> Adicionar Variante
            </button>

            <button onClick={saveProduct} disabled={saving} className={`w-full ${btnPrimary}`}>
              {saving ? "Salvando..." : "Salvar Variantes"}
            </button>
          </div>
        </div>
      )}

      {/* Seção: Descrição */}
      {activeSection === "description" && (
        <div className={cardClass}>
          <div className={headerClass}>
            <div className="w-9 h-9 rounded-lg bg-[hsl(280,80%,10%)] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[hsl(280,80%,65%)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Descrição do Produto</h3>
              <p className="text-[10px] text-[hsl(220,10%,40%)]">Use **negrito**, --- para separar seções, ✔ e • para listas</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <textarea
              value={product.description}
              onChange={e => setProduct({ ...product, description: e.target.value })}
              className={`${inputClass} min-h-[400px] font-mono`}
              placeholder="Descrição do produto..."
            />
            <button onClick={saveProduct} disabled={saving} className={`w-full ${btnPrimary}`}>
              {saving ? "Salvando..." : "Salvar Descrição"}
            </button>
          </div>
        </div>
      )}

      {/* Seção: Avaliações */}
      {activeSection === "reviews" && (
        <div className={cardClass}>
          <div className={headerClass}>
            <div className="w-9 h-9 rounded-lg bg-[hsl(45,80%,10%)] flex items-center justify-center">
              <Star className="w-4 h-4 text-[hsl(45,100%,55%)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Avaliações ({reviews.length})</h3>
              <p className="text-[10px] text-[hsl(220,10%,40%)]">Gerenciar depoimentos dos clientes</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
              {reviews.map((r, i) => (
                <div key={r.id} className="bg-[hsl(220,20%,8%)] rounded-lg p-3 border border-[hsl(220,15%,14%)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-[hsl(220,10%,50%)]">#{i + 1}</span>
                    <button onClick={() => removeReview(i)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <label className={labelClass}>Nome</label>
                      <input value={r.reviewer_name} onChange={e => updateReview(i, "reviewer_name", e.target.value)} className={inputClass} placeholder="nome.usuario" />
                    </div>
                    <div>
                      <label className={labelClass}>Estrelas</label>
                      <input type="number" min="1" max="5" value={r.rating} onChange={e => updateReview(i, "rating", Number(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Dias atrás</label>
                      <input type="number" min="0" value={r.days_ago} onChange={e => updateReview(i, "days_ago", Number(e.target.value))} className={inputClass} />
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className={labelClass}>Texto</label>
                    <textarea value={r.review_text} onChange={e => updateReview(i, "review_text", e.target.value)} className={`${inputClass} min-h-[50px]`} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Avatar URL</label>
                      <input value={r.avatar_url || ""} onChange={e => updateReview(i, "avatar_url", e.target.value || null)} className={inputClass} placeholder="URL do avatar" />
                    </div>
                    <div>
                      <label className={labelClass}>Fotos (URLs, vírgula)</label>
                      <input value={r.photos.join(", ")} onChange={e => updateReview(i, "photos", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className={inputClass} placeholder="url1, url2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addReview} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[hsl(220,20%,14%)] border border-[hsl(220,15%,20%)] text-[11px] text-[hsl(220,10%,55%)] hover:text-white transition-colors">
              <Plus className="w-3.5 h-3.5" /> Adicionar Avaliação
            </button>

            <button onClick={saveReviews} disabled={reviewsSaving} className={`w-full ${btnPrimary}`}>
              {reviewsSaving ? "Salvando..." : "Salvar Avaliações"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
