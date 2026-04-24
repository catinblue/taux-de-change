// FX Weather — Infinite Anchor Engine backend
// Cloudflare Worker (module format). Proxies a structured LLM call to OpenAI
// so the OPENAI_API_KEY never ships to the frontend.
//
// Deploy:
//   1. npm i -g wrangler && wrangler login
//   2. wrangler secret put OPENAI_API_KEY
//   3. wrangler deploy
//
// Endpoint: POST /search-ppp
//   Request  : { "query": "PS5 in Japan", "currency": "USD" }
//   Response : { "emoji": "🎮", "label": "PS5 (Tokyo)", "price": 539, "currency": "USD" }

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

function json(status, body) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...CORS },
    });
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: CORS });
        }

        const url = new URL(request.url);
        if (url.pathname !== '/search-ppp') {
            return json(404, { error: 'Not found' });
        }
        if (request.method !== 'POST') {
            return json(405, { error: 'Method not allowed' });
        }
        if (!env.OPENAI_API_KEY) {
            return json(500, { error: 'Server misconfigured: missing API key' });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return json(400, { error: 'Invalid JSON body' });
        }

        const query = typeof body.query === 'string' ? body.query.trim() : '';
        const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';
        if (!query || !/^[A-Z]{3}$/.test(currency)) {
            return json(400, { error: 'Required: {query: string, currency: ISO4217}' });
        }
        if (query.length > 200) {
            return json(400, { error: 'Query too long (max 200 chars)' });
        }

        const userMsg = `Item: ${query}\nTarget currency: ${currency}`;

        let openaiRes;
        try {
            openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: MODEL,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userMsg },
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.2,
                    max_tokens: 120,
                }),
            });
        } catch (err) {
            return json(502, { error: 'Upstream unreachable', detail: String(err) });
        }

        if (!openaiRes.ok) {
            const text = await openaiRes.text().catch(() => '');
            return json(502, { error: 'Upstream error', status: openaiRes.status, detail: text.slice(0, 400) });
        }

        let chat;
        try {
            chat = await openaiRes.json();
        } catch {
            return json(502, { error: 'Upstream returned non-JSON' });
        }

        const content = chat?.choices?.[0]?.message?.content;
        if (!content) return json(502, { error: 'Upstream returned no content' });

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch {
            return json(502, { error: 'Model output not valid JSON', raw: content.slice(0, 400) });
        }

        const emoji = typeof parsed.emoji === 'string' && parsed.emoji.length <= 4 ? parsed.emoji : '🏷️';
        const label = typeof parsed.label === 'string' ? parsed.label.slice(0, 64) : 'Unknown';
        const priceNum = Number(parsed.price);
        if (!Number.isFinite(priceNum) || priceNum < 0) {
            return json(502, { error: 'Model returned invalid price' });
        }
        const outCur = typeof parsed.currency === 'string' && /^[A-Z]{3}$/.test(parsed.currency)
            ? parsed.currency
            : currency;

        return json(200, {
            emoji,
            label,
            price: Math.round(priceNum * 100) / 100,
            currency: outCur,
        });
    },
};
