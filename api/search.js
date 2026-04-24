// FX Weather — LLM price-search endpoint (Vercel Serverless, CommonJS)
// Front-end posts {query, currency}; we proxy to OpenAI with a strict JSON
// system prompt and validate the response shape server-side so bad LLM output
// never reaches the client.
//
// Deploy:
//   vercel env add LLM_API_KEY   # paste your OpenAI API key
//   vercel deploy
//
// Request  : POST /api/search    Body: { "query": "PS5 in Japan", "currency": "USD" }
// Response : { "emoji": "🎮", "label": "PS5 (Tokyo)", "price": 539, "currency": "USD" }

const MODEL = 'gpt-4o-mini';

const SYSTEM_PROMPT = `You are a price-estimation assistant for a travel-FX app.

The user will give you an item description and a target currency. Return a SINGLE
JSON object with exactly these four fields and nothing else:

{
  "emoji": "<one emoji that represents the item>",
  "label": "<short name + city in parentheses, <=32 chars>",
  "price": <number in the target currency, no symbol, no thousands separator>,
  "currency": "<ISO 4217 three-letter code, matching the request>"
}

Rules:
- Price must be a realistic current-market estimate for the specified city/region.
- If no city is specified, infer the most canonical city for that item and note it
  in the label. Example: "PS5 in Japan" -> label "PS5 (Tokyo)".
- Use the target currency given in the request. Do NOT convert to local currency.
- Never wrap the JSON in code fences. Never add commentary.
- If the item is not a product/service or is unsafe, return
  {"emoji":"🏷️","label":"Unknown","price":0,"currency":"<requested>"}.`;

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

function applyCors(res) {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
}

module.exports = async function handler(req, res) {
    applyCors(res);

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.LLM_API_KEY) return res.status(500).json({ error: 'Server misconfigured: missing LLM_API_KEY' });

    // Vercel auto-parses JSON bodies when Content-Type: application/json
    const body = req.body || {};
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';

    if (!query || !/^[A-Z]{3}$/.test(currency)) {
        return res.status(400).json({ error: 'Required: {query: string, currency: ISO4217}' });
    }
    if (query.length > 200) {
        return res.status(400).json({ error: 'Query too long (max 200 chars)' });
    }

    const userMsg = `Item: ${query}\nTarget currency: ${currency}`;

    let openaiRes;
    try {
        openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LLM_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user',   content: userMsg },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2,
                max_tokens: 120,
            }),
        });
    } catch (err) {
        return res.status(502).json({ error: 'Upstream unreachable', detail: String(err) });
    }

    if (!openaiRes.ok) {
        const text = await openaiRes.text().catch(() => '');
        return res.status(502).json({ error: 'Upstream error', status: openaiRes.status, detail: text.slice(0, 400) });
    }

    let chat;
    try { chat = await openaiRes.json(); }
    catch { return res.status(502).json({ error: 'Upstream returned non-JSON' }); }

    const content = chat && chat.choices && chat.choices[0] && chat.choices[0].message
        ? chat.choices[0].message.content : null;
    if (!content) return res.status(502).json({ error: 'Upstream returned no content' });

    let parsed;
    try { parsed = JSON.parse(content); }
    catch { return res.status(502).json({ error: 'Model output not valid JSON', raw: content.slice(0, 400) }); }

    const emoji = typeof parsed.emoji === 'string' && parsed.emoji.length <= 4 ? parsed.emoji : '🏷️';
    const label = typeof parsed.label === 'string' ? parsed.label.slice(0, 64) : 'Unknown';
    const priceNum = Number(parsed.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
        return res.status(502).json({ error: 'Model returned invalid price' });
    }
    const outCur = typeof parsed.currency === 'string' && /^[A-Z]{3}$/.test(parsed.currency)
        ? parsed.currency
        : currency;

    res.status(200).json({
        emoji,
        label,
        price: Math.round(priceNum * 100) / 100,
        currency: outCur,
    });
};
