// FX Weather — Live Intel endpoint (Vercel Serverless, CommonJS)
// Generates 5 country-specific traveler-finance insights via Mistral, scoped
// to the user's detected country + currency + language. Universal traps
// (DCC, ATM fees, weekend markup) are explicitly excluded — those live as
// the front-end's hardcoded "iron rules". Front-end caches per
// (country, lang) for 24h to bound cost.
//
// Deploy:
//   vercel env add MISTRAL_API_KEY    # shared with /api/search
//   vercel deploy
//
// Request  : POST /api/intel
//            Body: { "country": "JP", "currency": "JPY", "lang": "en" }
// Response : { "items": [
//                { "emoji": "🍣", "title": "...", "body": "..." }, ... x5
//              ] }

const MODEL = 'mistral-small-latest';
const MISTRAL_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

const SYSTEM_PROMPT = `You are a hardcore travel-finance insider writing for a digital nomad about to use {{currency}} in {{country}}. They already know the universal traps — DCC, ATM flat fees, weekend FX markup — do NOT repeat any of those.

Return EXACTLY 5 high-value, COUNTRY-SPECIFIC insights an experienced traveler would consider non-obvious. Each tip should target ONE of:
- A unique local payment rail (e.g. Alipay TourCard, PromptPay, PIX, iDEAL, UPI)
- A pricing or refund quirk specific to this country
- A timing trap (e.g. Sunday closures, lunch-break closures, holiday surge pricing)
- A local consumer regulation that affects tourists' spend
- A counter-intuitive habit (cash vs cashless, tipping, queue norms)
- A specific high-value rate-arbitrage tip ("認準 X 商店" / "go to Y chain, not the airport booth")

Each item shape (and ONLY these three keys):
{ "emoji": "<one emoji, 1-2 chars>",
  "title": "<short headline, <= 32 chars>",
  "body":  "<1-3 short sentences, <= 220 chars total>" }

Final response shape:
{ "items": [ <item1>, <item2>, <item3>, <item4>, <item5> ] }

Hard rules:
- Output language: {{lang}} (en | zh | fr). Title and body must be in that language; emoji is universal.
- Use ranges or soft phrasing for any number ("about 0.5–1%", "around 5–7%") — never fake-precise figures.
- Brand names allowed if widely known (e.g. SuperRich for THB, Travelex generally bad).
- Never wrap the JSON in code fences, never add commentary outside JSON.
- If the country is too obscure or no useful tips exist, return an items array of length 1 with a single graceful fallback tip — front-end will show what comes back.`;

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

function applyCors(res) {
    for (const [k, v] of Object.entries(CORS)) res.setHeader(k, v);
}

function coerceItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const emoji = typeof raw.emoji === 'string' && raw.emoji.length <= 4 ? raw.emoji : '📍';
    const title = typeof raw.title === 'string' ? raw.title.slice(0, 64).trim() : '';
    const body  = typeof raw.body  === 'string' ? raw.body.slice(0, 320).trim() : '';
    if (!title || !body) return null;
    return { emoji, title, body };
}

module.exports = async function handler(req, res) {
    applyCors(res);

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });
    if (!process.env.MISTRAL_API_KEY) {
        return res.status(500).json({ error: 'Server misconfigured: missing MISTRAL_API_KEY' });
    }

    const body = req.body || {};
    const country  = typeof body.country  === 'string' ? body.country.trim().toUpperCase() : '';
    const currency = typeof body.currency === 'string' ? body.currency.trim().toUpperCase() : '';
    const langRaw  = typeof body.lang     === 'string' ? body.lang.trim().toLowerCase()    : 'en';
    const lang = ['en', 'zh', 'fr'].includes(langRaw) ? langRaw : 'en';

    if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z]{3}$/.test(currency)) {
        return res.status(400).json({ error: 'Required: {country: ISO3166α2, currency: ISO4217, lang: en|zh|fr}' });
    }

    const sys = SYSTEM_PROMPT
        .replace('{{country}}', country)
        .replace('{{currency}}', currency)
        .replace('{{lang}}', lang);

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
                    { role: 'system', content: sys },
                    { role: 'user',   content: `Country: ${country}\nCurrency: ${currency}\nOutput language: ${lang}` },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.4,
                max_tokens: 700,
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

    const rawItems = Array.isArray(parsed) ? parsed
        : Array.isArray(parsed.items) ? parsed.items
        : null;
    if (!rawItems) return res.status(502).json({ error: 'Model output missing items array' });

    const items = rawItems.map(coerceItem).filter(Boolean).slice(0, 5);
    if (items.length === 0) return res.status(502).json({ error: 'No valid items returned' });

    // Cache hint for the browser; front-end also caches per (country, lang)
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).json({ items });
};
