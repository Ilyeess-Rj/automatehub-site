// Vercel Serverless Function: /api/chat
// AutomateHub MIR Agent Backend

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "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";
const TAVILY_API_KEY = process.env.TAVILY_API_KEY || "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";
const MODEL_NAME = "meta/llama-3.2-11b-vision-instruct";

async function performTavilySearch(query) {
  try {
    const isSports = /match|score|result|barcelon|real madrid|liga|vs|today|hier|أمس|اليوم|نتيجة|مباراة/i.test(query);
    
    let searchResults = [];
    
    if (isSports) {
      const cleanQuery = query.replace(/\b(match|result|score|today|yesterday|what|is|the|of|for|مباراة|نتيجة)\b/gi, '').trim();
      const q = cleanQuery.length > 2 ? cleanQuery : query;
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: q,
          topic: "news",
          days: 2,
          max_results: 4
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          data.results.forEach(r => {
            searchResults.push(`[${r.title}]\n${r.content}\nSource: ${r.url}`);
          });
        }
      }
    }

    // General search if needed
    if (searchResults.length === 0) {
      const resGen = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: query,
          search_depth: "advanced",
          max_results: 4
        })
      });
      if (resGen.ok) {
        const data = await resGen.json();
        if (data.answer) {
          searchResults.unshift(`SUMMARY: ${data.answer}`);
        }
        if (data.results) {
          data.results.forEach(r => {
            searchResults.push(`[${r.title}]\n${r.content}\nSource: ${r.url}`);
          });
        }
      }
    }

    return searchResults.join("\n\n---\n\n");
  } catch (err) {
    console.error("Tavily search error:", err);
    return "";
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const todayDate = new Date().toLocaleDateString('ar-TN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Check if query warrants web search
    const needsSearch = /match|score|result|vs|today|yesterday|news|who is|weather|liga|champions|اليوم|أمس|مباراة|نتيجة|أخبار|سعر|من هو|طقس|برشلونة|ريال مدريد/i.test(message);

    let searchContext = "";
    if (needsSearch) {
      searchContext = await performTavilySearch(message);
    }

    const systemPrompt = `You are MIR (مير), the intelligent, articulate, and official AI Agent of AutomateHub (https://automatehub-site.vercel.app/).
Today's date is: ${todayDate}.

Capabilities & Rules:
1. Always introduce or present yourself naturally as MIR when asked or when greeting.
2. You speak fluent Arabic (with great knowledge of Tunisian Arabic), French, and English. Always reply in the language the user contacted you in.
3. For sports, match results, news, or current events: use the provided real-time search context below to give exact final scores, goal scorers, and dates. Never hallucinate outdated results.
4. If asked about AutomateHub, explain that AutomateHub is an upcoming next-generation platform for intelligent workflow automation, AI agents, and business efficiency.
5. Answer clearly, concisely, and format your answers with nice markdown (bullet points, bold text).

${searchContext ? `### REAL-TIME WEB SEARCH CONTEXT:\n${searchContext}\n` : ""}`;

    const formattedMessages = [
      { role: "system", content: systemPrompt }
    ];

    if (Array.isArray(history)) {
      history.slice(-8).forEach(msg => {
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
        temperature: 0.2,
        max_tokens: 1024
      })
    });

    if (!nvidiaRes.ok) {
      const errText = await nvidiaRes.text();
      console.error("NVIDIA API Error:", nvidiaRes.status, errText);
      return res.status(nvidiaRes.status).json({
        error: "NVIDIA API error",
        details: errText
      });
    }

    const nvidiaData = await nvidiaRes.json();
    const reply = nvidiaData.choices?.[0]?.message?.content || "عذراً، لم أتمكن من الحصول على إجابة.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}
