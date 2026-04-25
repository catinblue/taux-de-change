// FX Weather — Mistral compound price-search endpoint (Vercel Serverless, CommonJS)
// Front-end posts {query, currency}; we proxy to Mistral and return an ARRAY of
// 3 related price points spanning the spectrum (e.g., budget / mid / premium,
// or local-cafe / chain / supermarket variants), so the user instantly sees a
// pricing range instead of a single point.
//
// Deploy:
//   vercel env add MISTRAL_API_KEY   # paste your Mistral API key
//   vercel deploy
//
// Request  : POST /api/search    Body: { "query": "Coffee in Paris", "currency": "EUR" }
// Response : { "items": [
//                { "emoji":"☕", "label":"Local cafe espresso (Paris)",  "price":2.5,  "currency":"EUR" },
//                { "emoji":"☕", "label":"Starbucks latte tall (Paris)", "price":5.2,  "currency":"EUR" },
//                { "emoji":"🥤", "label":"Supermarket bottled coffee",   "price":1.8,  "currency":"EUR" }
//              ] }

const MODEL = 'mistral-small-latest';
const MISTRAL_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

const SYSTEM_PROMPT = `You are a price-estimation assistant for a travel-FX app.

Given an item description and a target currency, return a SINGLE JSON OBJECT with one
key "items" whose value is an ARRAY of EXACTLY 3 related price points spanning the
realistic spectrum for that item in the relevant city/region. Examples of spectra:
  - budget / mid / premium variant of the same product
  - local independent / chain / supermarket version
  - small / medium / large size

Each item is an object with EXACTLY these four keys:
{
  "emoji": "<one emoji>",
  "label": "<short name including the city in parentheses, <=32 chars>",
  "price": <number in the target currency, no symbol, no thousands separator>,
  "currency": "<ISO 4217 three-letter code, matching the request>"
}

Final shape:
{ "items": [ <item1>, <item2>, <item3> ] }

Rules:
- Use the target currency given in the request. Do NOT convert to local currency.
- If no city is specified, infer the most canonical city for the item and put it in each label.
- Order items from cheapest to most expensive.
- Never wrap the JSON in code fences. Never add commentary outside JSON.
- If the item is not a real product/service or is unsafe, return:
  { "items": [ { "emoji":"🏷️","label":"Unknown","price":0,"currency":"<requested>" } ] }
  (a single-element array — front-end will display a "no results" hint).`;

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

function applyCors(res) {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
}

// Normalise a raw item from the model into a strict client-trustable shape.
function coerceItem(raw, fallbackCurrency) {
    if (!raw || typeof raw !== 'object') return null;
    const emoji = typeof raw.emoji === 'string' && raw.emoji.length <= 4 ? raw.emoji : '🏷️';
    const label = typeof raw.label === 'string' ? raw.label.slice(0, 64) : 'Unknown';
    const priceNum = Number(raw.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return null;
    const currency = typeof raw.currency === 'string' && /^[A-Z]{3}$/.test(raw.currency)
        ? raw.currency
        : fallbackCurrency;
    return {
        emoji,
        label,
        price: Math.round(priceNum * 100) / 100,
        currency,
    };
}

module.exports = async function handler(req, res) {
    applyCors(res);

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.MISTRAL_API_KEY) return res.status(500).json({ error: 'Server misconfigured: missing MISTRAL_API_KEY' });

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

    let mistralRes;
    try {
        mistralRes = await fetch(MISTRAL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user',   content: userMsg },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2,
                max_tokens: 400,
            }),
        });
    } catch (err) {
        return res.status(502).json({ error: 'Upstream unreachable', detail: String(err) });
    }

    if (!mistralRes.ok) {
        const text = await mistralRes.text().catch(() => '');
        return res.status(502).json({ error: 'Upstream error', status: mistralRes.status, detail: text.slice(0, 400) });
    }

    let chat;
    try { chat = await mistralRes.json(); }
    catch { return res.status(502).json({ error: 'Upstream returned non-JSON' }); }

    const content = chat && chat.choices && chat.choices[0] && chat.choices[0].message
        ? chat.choices[0].message.content : null;
    if (!content) return res.status(502).json({ error: 'Upstream returned no content' });

    let parsed;
    try { parsed = JSON.parse(content); }
    catch { return res.status(502).json({ error: 'Model output not valid JSON', raw: content.slice(0, 400) }); }

    // Accept either { items: [...] } or a bare array (some models drift).
    const rawItems = Array.isArray(parsed) ? parsed
        : Array.isArray(parsed.items) ? parsed.items
        : null;
    if (!rawItems) return res.status(502).json({ error: 'Model output missing items array' });

    const items = rawItems.map(it => coerceItem(it, currency)).filter(Boolean).slice(0, 3);
    if (items.length === 0) return res.status(502).json({ error: 'No valid items returned' });

    res.status(200).json({ items });
};
