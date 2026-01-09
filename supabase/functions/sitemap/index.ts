import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml; charset=utf-8',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get base URL from request or use default
    const url = new URL(req.url);
    const baseUrl = url.searchParams.get('baseUrl') || 'https://techpulse.com';

    // Fetch all published articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('slug, title, published_at, updated_at, cover_image')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
      throw articlesError;
    }

    // Fetch all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('slug, name');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      throw categoriesError;
    }

    const now = new Date().toISOString();

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Categories Page -->
  <url>
    <loc>${baseUrl}/categories</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Search Page -->
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // Add category pages
    if (categories) {
      for (const category of categories) {
        sitemap += `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }

    // Add article pages with Google News tags
    if (articles) {
      for (const article of articles) {
        const pubDate = article.published_at 
          ? new Date(article.published_at).toISOString() 
          : now;
        const modDate = article.updated_at 
          ? new Date(article.updated_at).toISOString() 
          : pubDate;

        sitemap += `
  <url>
    <loc>${baseUrl}/article/${article.slug}</loc>
    <lastmod>${modDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <news:news>
      <news:publication>
        <news:name>TechPulse</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>`;

        // Add image if available
        if (article.cover_image) {
          sitemap += `
    <image:image>
      <image:loc>${escapeXml(article.cover_image)}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
    </image:image>`;
        }

        sitemap += `
  </url>`;
      }
    }

    // Add static pages
    sitemap += `
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/cookies</loc>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>

</urlset>`;

    return new Response(sitemap, { headers: corsHeaders });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>`,
      { status: 500, headers: corsHeaders }
    );
  }
});

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
