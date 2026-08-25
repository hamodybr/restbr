(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (window.__RESTBR_PUBLIC_ISOLATION_V1__) return;
  window.__RESTBR_PUBLIC_ISOLATION_V1__ = true;

  function tenantToken() {
    const params = new URLSearchParams(location.search);
    const rid = String(
      params.get('rid') ||
      params.get('restaurant_id') ||
      window.RESTBR_TENANT_ID ||
      ''
    ).trim();

    if (location.hostname === 'hamodybr.github.io') {
      return rid ? `rid:${rid}` : 'missing-rid';
    }

    return `host:${location.hostname.toLowerCase()}`;
  }

  function scopedKey(key) {
    const raw = String(key ?? '');
    if (!raw) return raw;
    if (raw === 'shorashLang') return raw;

    const restaurantKeys = new Set([
      'SHORASH_MENU_OFFLINE_CACHE_V1',
      'SHORASH_BRAND_CACHE_V1',
      'shorashCartV1',
      'shorashIntroSeen'
    ]);

    if (restaurantKeys.has(raw) || raw.startsWith('shorash:view:')) {
      return `RESTBR:${tenantToken()}:${raw}`;
    }

    return raw;
  }

  const storageProto = Storage.prototype;
  const originalGet = storageProto.getItem;
  const originalSet = storageProto.setItem;
  const originalRemove = storageProto.removeItem;

  storageProto.getItem = function(key) {
    return originalGet.call(this, scopedKey(key));
  };

  storageProto.setItem = function(key, value) {
    return originalSet.call(this, scopedKey(key), value);
  };

  storageProto.removeItem = function(key) {
    return originalRemove.call(this, scopedKey(key));
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    try {
      const raw = typeof input === 'string' ? input : input?.url;
      const url = new URL(raw, location.href);
      if (/\/tenant-template\/data\/menu\.json$/i.test(url.pathname)) {
        return Promise.reject(new Error('RESTBR static cross-tenant fallback disabled'));
      }
    } catch (_) {}
    return originalFetch(input, init);
  };

  const originalConsoleError = console.error.bind(console);
  console.error = (...args) => {
    try {
      if (String(args[0] || '').includes('SHORASH MENU ERROR')) {
        const detail = args[1];
        window.__RESTBR_BOOT_ERROR = String(detail?.message || detail || 'Unknown menu error');
      }
    } catch (_) {}
    originalConsoleError(...args);
  };

  window.addEventListener('error', event => {
    if (!window.__RESTBR_BOOT_ERROR && event?.message) {
      window.__RESTBR_BOOT_ERROR = String(event.message);
    }
  });

  window.addEventListener('unhandledrejection', event => {
    if (!window.__RESTBR_BOOT_ERROR) {
      const reason = event?.reason;
      window.__RESTBR_BOOT_ERROR = String(reason?.message || reason || 'Unhandled promise rejection');
    }
  });

  document.addEventListener('click', event => {
    const choice = event.target.closest?.('[data-sm-mode]');
    if (!choice) return;

    setTimeout(() => {
      const gate = document.querySelector('.sm-dining-gate.loading');
      if (!gate || window.SHORASH_DB) return;
      const loading = gate.querySelector('.sm-dining-loading');
      if (!loading) return;

      const error = String(window.__RESTBR_BOOT_ERROR || '').trim();
      loading.textContent = error
        ? `تعذر تحميل المنيو: ${error.slice(0, 150)}`
        : 'تعذر تحميل بيانات المطعم. يرجى تحديث الصفحة.';
    }, 10000);
  }, true);
})();
