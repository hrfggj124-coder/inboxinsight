import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  type?: "website" | "article";
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
  section?: string;
  wordCount?: number;
  noindex?: boolean;
}

export const SEOHead = ({
  title,
  description,
  canonical,
  type = "website",
  image = "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=630&fit=crop",
  publishedTime,
  modifiedTime,
  author,
  tags = [],
  section,
  wordCount,
  noindex = false,
}: SEOHeadProps) => {
  const siteTitle = "TechPulse - Your Source for Tech News & Analysis";
  const fullTitle = title === siteTitle ? title : `${title} | TechPulse`;
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://techpulse.com";
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : typeof window !== "undefined" ? window.location.href : siteUrl;

  // Generate NewsArticle structured data for Google News
  const generateNewsArticleSchema = () => ({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title.slice(0, 110), // Google recommends max 110 chars
    description: description,
    image: {
      "@type": "ImageObject",
      url: image,
      width: 1200,
      height: 630,
    },
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: {
      "@type": "Person",
      name: author || "TechPulse Staff",
      url: `${siteUrl}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "TechPulse",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
        width: 600,
        height: 60,
      },
      sameAs: [
        "https://twitter.com/techpulse",
        "https://facebook.com/techpulse",
        "https://linkedin.com/company/techpulse"
      ],
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    ...(section && { articleSection: section }),
    ...(tags.length > 0 && { keywords: tags.join(", ") }),
    ...(wordCount && { wordCount: wordCount }),
    isAccessibleForFree: true,
    inLanguage: "en-US",
  });

  // Generate BreadcrumbList schema
  const generateBreadcrumbSchema = () => {
    const items = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
    ];

    if (section) {
      items.push({
        "@type": "ListItem",
        position: 2,
        name: section,
        item: `${siteUrl}/category/${section.toLowerCase().replace(/\s+/g, '-')}`,
      });
    }

    if (type === "article") {
      items.push({
        "@type": "ListItem",
        position: items.length + 1,
        name: title,
        item: canonicalUrl,
      });
    }

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items,
    };
  };

  // Generate Organization schema
  const generateOrganizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: "TechPulse",
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/logo.png`,
      width: 600,
      height: 60,
    },
    sameAs: [
      "https://twitter.com/techpulse",
      "https://facebook.com/techpulse",
      "https://linkedin.com/company/techpulse"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "contact@techpulse.com",
    },
  });

  // Generate WebSite schema with search
  const generateWebsiteSchema = () => ({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TechPulse",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  });

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Google News specific meta tags */}
      {type === "article" && (
        <>
          <meta name="news_keywords" content={tags.join(", ")} />
          <meta name="robots" content="max-image-preview:large" />
        </>
      )}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="TechPulse" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@techpulse" />

      {/* Article specific Open Graph */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {type === "article" && section && (
        <meta property="article:section" content={section} />
      )}
      {type === "article" &&
        tags.map((tag) => <meta key={tag} property="article:tag" content={tag} />)}

      {/* Structured Data - NewsArticle for articles */}
      {type === "article" && (
        <script type="application/ld+json">
          {JSON.stringify(generateNewsArticleSchema())}
        </script>
      )}

      {/* Structured Data - BreadcrumbList */}
      <script type="application/ld+json">
        {JSON.stringify(generateBreadcrumbSchema())}
      </script>

      {/* Structured Data - Organization (for homepage) */}
      {type === "website" && (
        <script type="application/ld+json">
          {JSON.stringify(generateOrganizationSchema())}
        </script>
      )}

      {/* Structured Data - WebSite with Search */}
      {type === "website" && (
        <script type="application/ld+json">
          {JSON.stringify(generateWebsiteSchema())}
        </script>
      )}
    </Helmet>
  );
};
