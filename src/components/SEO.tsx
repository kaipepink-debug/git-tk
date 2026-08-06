/**
 * @file SEO.tsx
 * @description Componente reutilizável para gerenciar metadados SEO e Open Graph.
 */

import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

/**
 * Gerencia as tags de head dinamicamente para cada página.
 */
export const SEO = ({ 
  title, 
  description, 
  image, 
  url = window.location.href, 
  type = "website" 
}: SEOProps) => {
  const siteName = "Chiqueb Loja";
  const fullTitle = title ? `${title} | ${siteName}` : siteName;

  return (
    <Helmet>
      {/* Primário */}
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content={siteName} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};