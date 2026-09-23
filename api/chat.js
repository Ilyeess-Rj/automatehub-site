// Vercel Edge Function: /api/chat
// AutomateHub MIR Agent - Ultra-Fast Streaming & Real-Time Search Engine

export const config = {
  runtime: 'edge',
};

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "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";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "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";
const MODEL_NAME = "meta/llama-3.2-11b-vision-instruct";

function normalizeArabic(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
}

async function performTavilySearch(rawMessage) {
  const norm = normalizeArabic(rawMessage);

  let query = rawMessage;
  let topic = "general";
  let days = 3;

  // 1. AI, Tech, LLMs
  if (/(ia|ai|ذكاء|اصطناعي|تكنولوجيا|تقنية|موديل|نماذج|deepseek|openai|chatgpt|anthropic|claude|gemini)/i.test(norm)) {
    query = "latest artificial intelligence AI models OpenAI DeepSeek Anthropic Meta updates breakthroughs September 2026";
    topic = "news";
    days = 7;
  }
  // 2. Football & Sports Matches
  else if (/(ماتش|مباراه|نتيجه|كوره|برشلونه|ريال|دوري|ابطال|اهداف|match|score|result|vs|barca|madrid|liga)/i.test(norm)) {
    const cleanQuery = rawMessage.replace(/\b(match|result|score|today|yesterday|what|is|the|of|for|مباراة|ماتش|نتيجة|اليوم|أمس|البارح)\b/gi, '').trim();
    query = (cleanQuery.length > 2 ? cleanQuery : rawMessage) + " football match score result September 2026";
    topic = "news";
    days = 2;
  }
  // 3. General News, Current Events, Weather
  else if (/(اخبار|خبر|مستجدات|جديد|حدث|تطورات|طقس|سعر|من هو|شكون|news|latest|today|yesterday|price|weather)/i.test(norm)) {
    query = rawMessage;
    topic = "news";
    days = 4;
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(4000),
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        topic: topic,
        days: days,
        max_results: 3
      })
    });

    if (!res.ok) return "";

    const data = await res.json();
    let searchResults = [];

    if (data.results && Array.isArray(data.results)) {
      data.results.forEach((r, idx) => {
        const snippet = (r.content || "").slice(0, 320).replace(/\s+/g, ' ');
        searchResults.push(`• [مصدر ${idx + 1}: ${r.title}]: ${snippet}`);
      });
    }

    return searchResults.join("\n");
  } catch (err) {
    console.error("Tavily search skipped:", err.message);
    return "";
  }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await req.json();
    const { message, history } = body || {};

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const norm = normalizeArabic(message);
    const needsSearch = /(اخبار|خبر|مستجدات|جديد|اخر|تطورات|حدث|ia|ai|ذكاء|اصطناعي|تكنولوجيا|ماتش|مباراه|نتيجه|كوره|برشلونه|ريال|دوري|سعر|طقس|من هو|شكون|اليوم|امس|البارح|match|score|result|news|latest|today|yesterday)/i.test(norm);

    let searchContext = "";
    if (needsSearch) {
      searchContext = await performTavilySearch(message);
    }

    const todayDate = new Date().toLocaleDateString('ar-TN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const systemPrompt = `أنت MIR ⚡ (مير)، الوكيل الذكي الرسمي والمتطور جداً لمنصة AutomateHub (https://automatehub-site.vercel.app/).
تاريخ اليوم الرسمي والفعلي هو: ${todayDate}.

تعليمات الأداء العالي:
1. قدم نفسك دائماً باسم MIR ⚡ بأسلوب احترافي، حيوي، وواثق ومليء بالطاقة والذكاء.
2. إذا سألك المستخدم عن أخبار الذكاء الاصطناعي (AI/IA)، التكنولوجيا، نتائج المباريات، أو الأحداث الحالية:
   - لا تكن أبداً بارداً أو عاماً! بل قدم إجابات ثرية ومنسقة ومفصلة بأحدث الأسماء والشركات (مثل OpenAI, DeepSeek, Anthropic, Google, Meta)، والموديلات، والتواريخ، والنتائج الدقيقة.
   - استند بدقة وحرفية إلى سياق البحث اللحظي المباشر المرفق أدناه لتذكر آخر مستجدات الفترة الحالية.
   - نسق إجابتك باستخدام العناوين العريضة والنقاط وقائمة المصادر والإيموجي المناسبة.
3. أجب بنفس لغة ولهجة المستخدم (تونسي، عربي، فرنسي، إنجليزي) بذكاء وحرارة وترحاب.
4. إذا سأل عن AutomateHub: بين أنها المنصة الرائدة القادمة لأتمتة العمليات ووكلاء الذكاء الاصطناعي لرفع إنتاجية الأعمال.

${searchContext ? `### نتائج البحث المباشر في الأنترنت والويب (أحدث الأخبار والوقائع):\n${searchContext}\n` : ""}`;

    const formattedMessages = [
      { role: "system", content: systemPrompt }
    ];

    if (Array.isArray(history)) {
      history.slice(-4).forEach(msg => {
        if (msg.role && msg.content) {
          formattedMessages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content
          });
        }
      });
    }

    formattedMessages.push({ role: "user", content: message });

    const nvidiaRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: formattedMessages,
        temperature: 0.35,
        max_tokens: 600,
        stream: true
      })
    });

    if (!nvidiaRes.ok) {
      const errText = await nvidiaRes.text();
      return new Response(JSON.stringify({ error: "NVIDIA API error", details: errText }), {
        status: nvidiaRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(nvidiaRes.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error("Edge handler error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error", message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
