/* Base URL of the backend API.
   - Deployed (Vercel): set VITE_API_URL in the Vercel project settings to your
     Render URL + /api, e.g. https://your-service.onrender.com/api
     (it is baked in at build time, so redeploy after changing it).
   - Local dev (npm run dev): defaults to the local server.
   - Deployed with no VITE_API_URL: uses "/api" on the same domain, which works
     if vercel.json proxies /api to Render (see README). */
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');
