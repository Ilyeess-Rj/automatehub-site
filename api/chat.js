// Vercel Edge Function: /api/chat
// AutomateHub MIR Agent - Ultra-Fast Streaming & Real-Time Search Engine

export const config = {
  runtime: 'edge',
};

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "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";
const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || "pub_1cad427f82c94e54a40826588354b207";
const MODEL_NAME = "meta/llama-3.2-11b-vision-instruct";

function normalizeArabic(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '');
}

async function performNewsSearch(rawMessage) {
  const norm = normalizeArabic(rawMessage);

  let query = rawMessage;
  let language = "ar,en,fr";
  let category = "";

  // 1. AI & Tech
  if (/(ia|ai|ذكاء|اصطناعي|تكنولوجيا|تقنية|موديل|نماذج|deepseek|openai|chatgpt|anthropic|claude|gemini)/i.test(norm)) {
    query = "artificial intelligence AI OpenAI DeepSeek Anthropic Meta latest";
    category = "technology";
  }
  // 2. Football & Sports
  else if (/(ماتش|مباراه|نتيجه|كوره|برشلونه|ريال|دوري|ابطال|اهداف|match|score|result|vs|barca|madrid|liga)/i.test(norm)) {
    const cleanQuery = rawMessage.replace(/\b(match|result|score|today|yesterday|what|is|the|of|for|مباراة|ماتش|نتيجة|اليوم|أمس|البارح)\b/gi, '').trim();
    query = (cleanQuery.length > 2 ? cleanQuery : rawMessage) + " match score result";
    category = "sports";
  }

  try {
    const url = new URL("https://newsdata.io/api/1/news");
    url.searchParams.append("apikey", NEWSDATA_API_KEY);
    url.searchParams.append("q", query);
    url.searchParams.append("language", language);
    if (category) url.searchParams.append("category", category);

    const res = await fetch(url.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) return "";

    const data = await res.json();
    let searchResults = [];

    if (data.results && Array.isArray(data.results)) {
      data.results.slice(0, 3).forEach((item, idx) => {
        const title = item.title || "";
        const desc = (item.description || item.content || "").slice(0, 300).replace(/\s+/g, ' ');
        searchResults.push(`• [خبر ${idx + 1}: ${title}]: ${desc}`);
      });
    }

    return searchResults.join("\n");
  } catch (err) {
    console.error("NewsData search skipped:", err.message);
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
      try {
        searchContext = await performNewsSearch(message);
      } catch (e) {
        searchContext = "";
      }
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
2. إذا سألك المستخدم عن أخبار، تكنولوجيا، مباريات، أو مستجدات:
   - قدم إجابات ثرية ومنسقة ومفصلة.
   - إذا توفرت نتائج البحث المباشر أدناه، استند إليها بدقة. وإن لم تتوفر، أجب بأفضل معلوماتك وتحليلك بذكاء وبدون إحباط المستخدم.
   - أكمل دائماً إجابتك بالكامل ولا تتوقف في منتصف الجملة.
3. أجب بنفس لغة ولهجة المستخدم (تونسي، عربي، فرنسي، إنجليزي) بذكاء وحرارة وترحاب.
4. نسق إجاباتك بالعناوين العريضة والنقاط الواضحة.

${searchContext ? `### نتائج البحث المباشر في الويب:\n${searchContext}\n` : ""}`;

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
        temperature: 0.6,
        presence_penalty: 0.5,
        frequency_penalty: 0.5,
        max_tokens: 1500,
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
