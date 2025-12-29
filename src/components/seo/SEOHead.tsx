import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  type?: "website" | "article";
  image?: string;
  publishedTime?: string;
  author?: string;
  tags?: string[];
  noindex?: boolean;
}

export const SEOHead = ({
  title,
  description,
  canonical,
  type = "website",
  image = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop",
  publishedTime,
  author,
  tags = [],
  noindex = false,
}: SEOHeadProps) => {
  const siteTitle = "TechPulse - Your Source for Tech News & Analysis";
  const fullTitle = title === siteTitle ? title : `${title} | TechPulse`;
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://techpulse.com";
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : typeof window !== "undefined" ? window.location.href : siteUrl;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="TechPulse" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@techpulse" />

      {/* Article specific */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {type === "article" &&
        tags.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

      {/* Structured Data for NewsArticle */}
      {type === "article" && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            headline: title,
            description: description,
            image: [image],
            datePublished: publishedTime,
            author: {
              "@type": "Person",
              name: author,
            },
            publisher: {
              "@type": "Organization",
              name: "TechPulse",
              logo: {
                "@type": "ImageObject",
                url: `${siteUrl}/logo.png`,
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": canonicalUrl,
            },
          })}
        </script>
      )}

      {/* Website Structured Data */}
      {type === "website" && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "TechPulse",
            url: siteUrl,
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          })}
        </script>
      )}
    </Helmet>
  );
};
