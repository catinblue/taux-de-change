// FX Weather — Geo endpoint (Vercel Serverless, CommonJS)
// Zero-click location read from Vercel Edge Network headers. No cookies,
// no geolocation prompt, no IP stored anywhere on our side.
//
// Deploy:
//   Drop this file at /api/geo.js. Vercel auto-registers the endpoint.
//   No env vars needed.
//
// Request  : GET /api/geo
// Response : { "country": "JP", "city": "Osaka" }  (both may be empty strings
//            when Vercel cannot resolve the visitor, e.g. local `vercel dev`).

module.exports = function handler(req, res) {
    const country = req.headers['x-vercel-ip-country'] || '';
    const cityRaw = req.headers['x-vercel-ip-city'] || '';
    // Vercel URL-encodes city names with non-ASCII chars. Try to decode;
    // on any codec error, fall back to the raw value rather than crash.
    let city = '';
    try { city = cityRaw ? decodeURIComponent(cityRaw) : ''; }
    catch { city = cityRaw; }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json({ country, city });
};
