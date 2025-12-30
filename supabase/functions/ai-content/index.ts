import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateArticleRequest {
  type: 'generate' | 'suggest-headline' | 'suggest-summary' | 'suggest-seo' | 'improve-content';
  topic?: string;
  content?: string;
  title?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { type, topic, content, title }: GenerateArticleRequest = await req.json();
    console.log('AI Content request:', { type, topic: topic?.substring(0, 50), hasContent: !!content });

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'generate':
        systemPrompt = `You are an expert tech journalist writing for a professional technology news website. Your articles are well-researched, engaging, and informative. Write in a clear, authoritative voice suitable for tech-savvy readers. Always cite sources when mentioning specific facts or statistics.`;
        userPrompt = `Write a comprehensive tech news article about the following topic. Include:
- A compelling headline
- An engaging excerpt (2-3 sentences)
- Full article content (800-1200 words) with proper paragraphs
- Suggested category from: AI, Software, Startups, Big Tech, Cybersecurity, Cloud, Programming, Gadgets, Web3, Fintech, Data, Robotics, Policy, SaaS
- 3-5 relevant tags
- Estimated read time in minutes

Topic: ${topic}

Respond in JSON format:
{
  "title": "headline",
  "excerpt": "brief summary",
  "content": "full article with HTML paragraphs using <p> tags",
  "category": "suggested category",
  "tags": ["tag1", "tag2", "tag3"],
  "readTime": 5
}`;
        break;

      case 'suggest-headline':
        systemPrompt = `You are an expert headline writer for tech news. Create compelling, SEO-optimized headlines that are accurate and engaging.`;
        userPrompt = `Based on this article content, suggest 5 alternative headlines that are compelling and SEO-friendly:

${content?.substring(0, 2000)}

Respond in JSON format:
{
  "headlines": ["headline1", "headline2", "headline3", "headline4", "headline5"]
}`;
        break;

      case 'suggest-summary':
        systemPrompt = `You are a tech news editor skilled at writing concise, engaging article summaries.`;
        userPrompt = `Write 3 alternative summaries/excerpts (2-3 sentences each) for this article:

Title: ${title}
Content: ${content?.substring(0, 2000)}

Respond in JSON format:
{
  "summaries": ["summary1", "summary2", "summary3"]
}`;
        break;

      case 'suggest-seo':
        systemPrompt = `You are an SEO expert specializing in tech news content optimization.`;
        userPrompt = `Analyze this article and provide SEO recommendations:

Title: ${title}
Content: ${content?.substring(0, 2000)}

Provide:
- Optimized meta title (under 60 characters)
- Meta description (under 160 characters)
- 5-10 SEO keywords
- Content improvement suggestions

Respond in JSON format:
{
  "seoTitle": "optimized title",
  "seoDescription": "meta description",
  "keywords": ["keyword1", "keyword2"],
  "suggestions": ["improvement1", "improvement2"]
}`;
        break;

      case 'improve-content':
        systemPrompt = `You are a tech news editor who improves article quality while maintaining the author's voice.`;
        userPrompt = `Improve this article for clarity, engagement, and accuracy. Keep the core message but enhance readability:

Title: ${title}
Content: ${content}

Respond in JSON format:
{
  "improvedContent": "improved article with HTML paragraphs",
  "changes": ["change1", "change2", "change3"]
}`;
        break;

      default:
        throw new Error('Invalid request type');
    }

    console.log('Calling Lovable AI with type:', type);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage limit reached. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    console.log('AI response received, length:', aiResponse.length);

    // Parse JSON from response
    let parsedResponse;
    try {
      // Extract JSON from response if wrapped in markdown code blocks
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiResponse.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      parsedResponse = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      parsedResponse = { raw: aiResponse };
    }

    return new Response(
      JSON.stringify({ success: true, data: parsedResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Content error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
