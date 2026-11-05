// traffic.js: sends a mix of requests to the Kazibuddy API, to give us data.
// Run (cmd):  set KEY=abc123 && node traffic.js
// Optional:   set N=200 && set KEY=abc123 && node traffic.js

const API = process.env.API || 'http://localhost:3000';
const KEY = process.env.KEY || 'abc123';          // partner key
const WEB_KEY = process.env.WEB_KEY || 'xyz789';  // web key (wrong scope for artisans)
const N = Number(process.env.N || 60);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
    // Find a real artisan id so /api/artisans/:id gets some 200s.
    let realId = 'none';
    try {
        const res = await fetch(API + '/api/artisans', { headers: { 'X-API-Key': KEY } });
        const data = await res.json();
        if (data.artisans && data.artisans.length > 0) realId = data.artisans[0].id;
    } catch (err) {
        console.log('Could not reach the server. Is it running?');
        return;
    }

    const mix = [
        { path: '/api/artisans', key: KEY },
        { path: '/api/artisans', key: KEY },
        { path: '/api/artisans/' + realId, key: KEY },        // real id
        { path: '/api/artisans/99999', key: KEY },            // no such id -> 404
        { path: '/api/artisans', key: null },                 // no key -> 401
        { path: '/api/artisans', key: 'wrong' },              // wrong key -> 401
        { path: '/api/artisans', key: WEB_KEY },              // wrong scope -> 403
        { path: '/api/not-a-route', key: KEY },               // no such path -> 404
        { path: '/api/health', key: null },                   // health check -> 200
    ];

    const counts = {};
    for (let i = 0; i < N; i++) {
        const r = mix[Math.floor(Math.random() * mix.length)];
        try {
            const res = await fetch(API + r.path, {
                method: 'GET',
                headers: r.key ? { 'X-API-Key': r.key } : {},
            });
            counts[res.status] = (counts[res.status] || 0) + 1;
        } catch (err) {
            counts.failed = (counts.failed || 0) + 1;
        }
        await pause(50);
    }

    console.log('Status codes received:', counts);
})();