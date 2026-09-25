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

  let query = rawMessage.trim();
  let language = "ar,en,fr";
  let category = "";

  // 1. AI, Tech, Startups & Global Ecosystem
  if (/(ia|ai|ذكاء|اصطناعي|تكنولوجيا|تقنية|موديل|نماذج|llm|agent|deepseek|openai|chatgpt|anthropic|claude|gemini|mistral|meta|llama|grok|nvidia|google)/i.test(norm)) {
    // نحافظ على كلمات المستخدم مع إثراء الاستعلام بأوسع المفاهيم التقنية
    const cleanAI = rawMessage.replace(/[؟?!.,]/g, '').trim();
    query = cleanAI.length > 3 ? cleanAI : "artificial intelligence AI LLMs models tech breakthroughs updates";
    category = "technology";
  }
  // 2. Football & Sports (شامل للماضي، الحاضر، الجداول والمباريات القادمة)
  else if (/(ماتش|مباراه|مباريات|مقابله|نتيجه|كوره|برشلونه|ريال|دوري|ابطال|اهداف|ترتيب|جدول|match|matches|score|fixture|fixtures|schedule|vs|barca|madrid|liga|ucl)/i.test(norm)) {
    const cleanSport = rawMessage.replace(/[؟?!.,]/g, '').trim();
    query = cleanSport.length > 3 ? cleanSport : "football match score fixtures schedule";
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
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) return "";

    const data = await res.json();
    let searchResults = [];

    // نأخذ حتى 6 نتائج كاملة، مع عمق تفصيلي (Snippet يصل إلى 700 حرف وتاريخ النشر)
    if (data.results && Array.isArray(data.results)) {
      data.results.slice(0, 6).forEach((item, idx) => {
        const title = item.title || "";
        const pubDate = item.pubDate ? ` [بتاريخ: ${item.pubDate}]` : "";
        const source = item.source_name ? ` (المصدر: ${item.source_name})` : "";
        const desc = (item.description || item.content || "").slice(0, 700).replace(/\s+/g, ' ');
        if (title || desc) {
          searchResults.push(`• [المرجع ${idx + 1}${source}${pubDate}]: ${title} - ${desc}`);
        }
      });
    }

    return searchResults.join("\n\n");
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

    const systemPrompt = `أنت MIR ⚡ (مير)، الوكيل الذكي الرسمي والمتطور لمنصة AutomateHub (https://automatehub-site.vercel.app/).
تاريخ اليوم الفعلي هو: ${todayDate}.

تعليمات تقديم الإجابات التقنية والمعلوماتية الاحترافية:
1. قدم نفسك باسم MIR ⚡ بأسلوب واثق، خبير وعالي الاحترافية.
2. عند الإجابة عن التكنولوجيا، الذكاء الاصطناعي، الشركات، والرياضة (المباريات السابقة أو القادمة):
   - تجنب الإجابات السطحية والموجزة! قدم تفاصيل غنية، تشمل التواريخ الدقيقة، الأطراف، النتائج، المواعيد، والتحليلات.
   - إذا توفرت مراجع بحث الويب أدناه، استند إليها بدقة واذكر تفاصيلها الموثقة وتواريخها.
   - في الرياضة: وضح إن كانت المباراة لُعبت بالفعل مع النتيجة والمسجلين، أو موعدها القادم والبطولة والملعب إن كانت مجدولة.
   - نسق إجابتك باستخدام العناوين الواضحة، النقاط، والجداول إذا لزم الأمر.
3. أجب بنفس لغة ولهجة المستخدم (تونسي، عربي، فرنسي، إنجليزي) بذكاء وحرارة وترحاب.
4. أنهِ إجابتك دائماً بشكل مكتمل ومنطقي.

${searchContext ? `### مراجع ومعلومات البحث المباشر في الويب:\n${searchContext}\n` : ""}`;

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
