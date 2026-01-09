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

    const url = new URL(req.url);
    const baseUrl = url.searchParams.get('baseUrl') || 'https://techpulse.com';
    const type = url.searchParams.get('type') || 'index';
    const month = url.searchParams.get('month'); // Format: YYYY-MM

    // Generate sitemap index
    if (type === 'index') {
      return await generateSitemapIndex(supabase, baseUrl, url.origin);
    }

    // Generate monthly news sitemap
    if (type === 'news' && month) {
      return await generateNewsSitemap(supabase, baseUrl, month);
    }

    // Generate static pages sitemap
    if (type === 'static') {
      return generateStaticSitemap(baseUrl);
    }

    // Generate categories sitemap
    if (type === 'categories') {
      return await generateCategoriesSitemap(supabase, baseUrl);
    }

    // Default: return index
    return await generateSitemapIndex(supabase, baseUrl, url.origin);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>`,
      { status: 500, headers: corsHeaders }
    );
  }
});

async function generateSitemapIndex(supabase: any, baseUrl: string, functionUrl: string) {
  // Get distinct months from published articles
  const { data: articles, error } = await supabase
    .from('articles')
    .select('published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) throw error;

  // Extract unique months
  const months = new Set<string>();
  articles?.forEach((article: { published_at: string }) => {
    if (article.published_at) {
      const date = new Date(article.published_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    }
  });

  const now = new Date().toISOString();
  const sitemapBaseUrl = functionUrl + '/sitemap';

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- Static Pages Sitemap -->
  <sitemap>
    <loc>${sitemapBaseUrl}?type=static&amp;baseUrl=${encodeURIComponent(baseUrl)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  
  <!-- Categories Sitemap -->
  <sitemap>
    <loc>${sitemapBaseUrl}?type=categories&amp;baseUrl=${encodeURIComponent(baseUrl)}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
`;

  // Add monthly news sitemaps
  for (const month of Array.from(months).sort().reverse()) {
    const [year, m] = month.split('-');
    const lastDay = new Date(parseInt(year), parseInt(m), 0).getDate();
    const lastmod = `${year}-${m}-${String(lastDay).padStart(2, '0')}T23:59:59Z`;
    
    sitemap += `
  <!-- News Sitemap: ${month} -->
  <sitemap>
    <loc>${sitemapBaseUrl}?type=news&amp;month=${month}&amp;baseUrl=${encodeURIComponent(baseUrl)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`;
  }

  sitemap += `
</sitemapindex>`;

  return new Response(sitemap, { headers: corsHeaders });
}

async function generateNewsSitemap(supabase: any, baseUrl: string, month: string) {
  const [year, m] = month.split('-');
  const startDate = `${year}-${m}-01T00:00:00Z`;
  const endDate = new Date(parseInt(year), parseInt(m), 0, 23, 59, 59).toISOString();

  const { data: articles, error } = await supabase
    .from('articles')
    .select('slug, title, published_at, updated_at, cover_image')
    .eq('status', 'published')
    .gte('published_at', startDate)
    .lte('published_at', endDate)
    .order('published_at', { ascending: false });

  if (error) throw error;

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  if (articles) {
    for (const article of articles) {
      const pubDate = new Date(article.published_at).toISOString();
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

  sitemap += `
</urlset>`;

  return new Response(sitemap, { headers: corsHeaders });
}

async function generateCategoriesSitemap(supabase: any, baseUrl: string) {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('slug, name');

  if (error) throw error;

  const now = new Date().toISOString();

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <url>
    <loc>${baseUrl}/categories</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

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

  sitemap += `
</urlset>`;

  return new Response(sitemap, { headers: corsHeaders });
}

function generateStaticSitemap(baseUrl: string) {
  const now = new Date().toISOString();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/search</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  
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
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
