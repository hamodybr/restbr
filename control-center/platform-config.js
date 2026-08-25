// RESTBR Control Center — public browser configuration fallback.
// Supabase Publishable keys are designed for client-side use.
// Never place database passwords or privileged server credentials here.
(() => {
  'use strict';

  const config = Object.freeze({
    supabase_url: 'https://xdqewaapwhmqlfotaofg.supabase.co',
    publishable_key: 'sb_publishable_dOGkocLtn1WVvrxmu6TnJQ_8qyPyV-T'
  });

  window.RESTBR_CONTROL_CENTER_CONFIG = config;

  // The production Control Center receives /_restbr/platform-config from the
  // Cloudflare Router. A direct hamodybr.github.io preview has no such route,
  // so intercept only that single config request on GitHub Pages.
  if (location.hostname !== 'hamodybr.github.io' || typeof window.fetch !== 'function') return;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = function restbrPreviewFetch(input, init) {
    try {
      const raw = typeof input === 'string' ? input : input?.url;
      const url = new URL(raw || '', location.href);
      if (url.origin === location.origin && url.pathname === '/_restbr/platform-config') {
        return Promise.resolve(new Response(JSON.stringify({
          ok: true,
          source: 'github-pages-preview',
          supabase_url: config.supabase_url,
          publishable_key: config.publishable_key
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
          }
        }));
      }
    } catch (_) {
      // Any unrelated/invalid request falls through to the browser fetch.
    }
    return nativeFetch(input, init);
  };
})();
