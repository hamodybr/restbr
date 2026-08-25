(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (window.__RESTBR_PUBLIC_ISOLATION_V1__) return;
  window.__RESTBR_PUBLIC_ISOLATION_V1__ = true;

  function restaurantId() {
    const params = new URLSearchParams(location.search);
    return String(
      params.get('rid') ||
      params.get('restaurant_id') ||
      window.RESTBR_TENANT_ID ||
      ''
    ).trim();
  }

  function tenantToken() {
    const rid = restaurantId();

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

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function money(value) {
    const lang = window.SHORASH_LANG ? window.SHORASH_LANG() : (localStorage.getItem('shorashLang') || 'ar');
    return Number(value || 0).toLocaleString('en-US') + ' ' + (lang === 'en' ? 'IQD' : 'د.ع');
  }

  function discountForProduct(product, discounts, mode) {
    const productId = String(product?.id ?? '');
    const categoryId = String(product?.category?.id ?? product?.category_id ?? '');
    let bestRank = 0;
    let bestPercent = 0;

    (discounts || []).forEach(row => {
      if (!row || row.is_active === false) return;
      if (row.price_mode !== 'both' && row.price_mode !== mode) return;

      const percent = Number(row.discount_percent);
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return;

      let rank = 0;
      if (row.scope_type === 'product' && String(row.target_id ?? '') === productId) rank = 3;
      else if (row.scope_type === 'category' && categoryId && String(row.target_id ?? '') === categoryId) rank = 2;
      else if (row.scope_type === 'restaurant') rank = 1;
      else return;

      if (rank > bestRank || (rank === bestRank && percent > bestPercent)) {
        bestRank = rank;
        bestPercent = percent;
      }
    });

    return bestPercent;
  }

  function updateVisiblePrices() {
    const db = window.SHORASH_DB;
    if (!db?.products) return;

    db.products.forEach(product => {
      const safeId = String(product.id).replace(/"/g, '\\"');
      const card = document.querySelector(`[data-product-card="${safeId}"]`);
      if (!card) return;

      const nodes = [...card.querySelectorAll('.sm-price')];
      (product.options || []).forEach((option, index) => {
        const node = nodes[index];
        if (!node) return;

        const current = Number(option.price || 0);
        const original = Number(option._modeOriginalPrice ?? current);
        const percent = Number(option._discountPercent || 0);

        if (percent > 0 && original > current) {
          node.classList.add('sm-price-discounted');
          node.innerHTML = `<span class="sm-price-before">${escapeHtml(money(original))}</span><span class="sm-price-after">${escapeHtml(money(current))}</span>`;
        } else {
          node.classList.remove('sm-price-discounted');
          node.textContent = money(current);
        }
      });
    });
  }

  async function restJson(table, select, extra = '') {
    const base = String(window.SUPABASE_URL || '').replace(/\/$/, '');
    const key = String(window.SUPABASE_PUBLISHABLE_KEY || '');
    const rid = restaurantId();

    if (!base || !key || !rid) {
      throw new Error('RESTBR tenant API context is incomplete');
    }

    const url = new URL(`${base}/rest/v1/${table}`);
    url.searchParams.set('select', select);
    url.searchParams.set('restaurant_id', `eq.${rid}`);

    if (extra) {
      const params = new URLSearchParams(extra);
      params.forEach((value, name) => url.searchParams.append(name, value));
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await originalFetch(url.toString(), {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        const body = (await response.text()).slice(0, 160);
        throw new Error(`${table} HTTP ${response.status}${body ? ` — ${body}` : ''}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } finally {
      clearTimeout(timer);
    }
  }

  async function recoverDiningMode(mode, gate) {
    if (!gate?.isConnected || !gate.classList.contains('loading')) return;

    const loading = gate.querySelector('.sm-dining-loading');
    const db = window.SHORASH_DB;

    if (!db?.products) {
      if (loading) {
        const error = String(window.__RESTBR_BOOT_ERROR || '').trim();
        loading.textContent = error
          ? `تعذر تحميل المنيو: ${error.slice(0, 150)}`
          : 'تعذر تحميل بيانات المطعم. يرجى تحديث الصفحة.';
      }
      return;
    }

    try {
      if (loading) loading.textContent = 'جاري إعادة مزامنة الأسعار...';

      const [priceRows, discountRows] = await Promise.all([
        restJson('product_options', 'id,product_id,price,takeaway_price'),
        restJson('discounts', 'id,discount_percent,price_mode,scope_type,target_id,is_active,created_at', 'is_active=eq.true')
      ]);

      if (!gate?.isConnected || !gate.classList.contains('loading')) return;

      const priceMap = new Map(priceRows.map(row => [String(row.id), row]));

      db.products.forEach(product => {
        const percent = discountForProduct(product, discountRows, mode);

        (product.options || []).forEach(option => {
          const row = priceMap.get(String(option.id));
          const inside = Number(row?.price ?? option._insidePrice ?? option.price ?? 0);
          const rawTakeaway = row?.takeaway_price;
          const takeaway = rawTakeaway === null || rawTakeaway === undefined || rawTakeaway === ''
            ? inside
            : Number(rawTakeaway);

          option._insidePrice = Number.isFinite(inside) ? inside : 0;
          option._takeawayPrice = Number.isFinite(takeaway) ? takeaway : option._insidePrice;

          const original = mode === 'takeaway' ? option._takeawayPrice : option._insidePrice;
          option._modeOriginalPrice = original;
          option._discountPercent = percent;
          option.price = percent > 0
            ? Math.max(0, Math.round(original * (100 - percent) / 100))
            : original;
        });
      });

      document.documentElement.classList.toggle('sm-mode-dinein', mode === 'dinein');
      document.documentElement.classList.toggle('sm-mode-takeaway', mode === 'takeaway');
      document.documentElement.dataset.smDiningMode = mode;
      window.SHORASH_ORDER_MODE = mode;
      window.__RESTBR_DINING_RECOVERED__ = true;

      updateVisiblePrices();
      gate.remove();

      window.dispatchEvent(new CustomEvent('shorash:prices-updated', {
        detail: { source: 'restbr-watchdog', mode, discounts: true }
      }));
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? 'انتهت مهلة تحميل الأسعار. تحقق من الاتصال وأعد المحاولة.'
        : `تعذر تحميل الأسعار: ${String(error?.message || error).slice(0, 150)}`;

      if (loading) loading.textContent = message;
      console.error('RESTBR DINING WATCHDOG ERROR:', error);
    }
  }

  document.addEventListener('click', event => {
    const choice = event.target.closest?.('[data-sm-mode]');
    if (!choice) return;

    const mode = String(choice.dataset.smMode || '');
    if (!['dinein', 'takeaway'].includes(mode)) return;

    setTimeout(() => {
      const gate = document.querySelector('.sm-dining-gate.loading');
      if (!gate) return;
      void recoverDiningMode(mode, gate);
    }, 5500);
  }, true);
})();
