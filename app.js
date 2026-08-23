(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const RTL = new Set(['ar', 'ku']);
  const CATEGORY_EFFECTS = {
    '252e075e-fe39-cb3e-bdde-78093ec238d8': 'sm-breakfast-card',
    '8ff059a5-a801-2303-e399-70aff8013c0c': 'sm-mansaf-card',
    'c7c80193-ba39-b166-0d9c-d9019c062f13': 'sm-eastern-card',
    'b77b7d38-4a08-218a-2ba4-2358132a7cfd': 'sm-grill-card',
    '191038f4-383e-f189-0096-82ba38f26a52': 'sm-qalya-card',
    '774fbe19-a225-a6e3-8b57-8723b77dfa46': 'sm-western-card',
    '236d7d07-032a-f2e2-8c4b-b516e69db5ca': 'sm-burger-card',
    '2e2976b6-ec70-e2b3-66d4-18ef07123b33': 'sm-pizza-card',
    '5f8a8555-571e-4342-3ac1-2790b1c59b72': 'sm-sandwich-card',
    '308999fe-98a4-e077-39a5-4c0c6926e5ef': 'sm-cold-card',
    '8429f48e-67a4-cfd4-e99b-0f6819035b3e': 'sm-coffee-card',
    '13fd9d9d-ea54-5af3-2d8b-f3316397613c': 'sm-icedcoffee-card sm-cold-card',
    'b2ba3c3f-1087-aafe-8bea-b65f94027548': 'sm-mojito-card sm-cold-card',
    '6c923994-0600-9eae-4099-a65c570b4141': 'sm-smoothie-card sm-cold-card',
    '10f6dc18-d147-4337-f127-3ebf4f185053': 'sm-milkshake-card sm-cold-card',
    '55137541-b820-531d-340a-18a16de0d2ea': 'sm-dessert-card'
  };

  const I18N = {
    ar: {
      search: 'ابحث عن صنف...', results: n => `${n} نتيجة`, noResults: 'ما لقينا صنف مطابق',
      location: 'موقعنا', call: 'اتصال', whatsapp: 'واتساب', cart: 'السلة', clear: 'مسح',
      emptyCart: 'السلة فارغة', total: 'الإجمالي', continue: 'متابعة الطلب', choose: 'اختر', add: 'إضافة',
      chooseHint: 'اختر الحجم أو الخيار', checkout: 'إكمال الطلب', name: 'الاسم', phone: 'رقم الهاتف',
      orderType: 'نوع الطلب', pickup: 'استلام', delivery: 'توصيل', locate: '📍 تحديد موقعي', locating: 'جاري تحديد الموقع...',
      locationDone: 'تم تحديد الموقع ✓', locationFail: 'تعذر تحديد الموقع — يمكنك متابعة الطلب', notes: 'ملاحظات',
      review: 'مراجعة الطلب', send: 'إرسال الطلب على واتساب', added: 'تمت الإضافة للسلة', copied: 'تم نسخ الرابط',
      share: 'مشاركة', newLabel: 'جديد', popular: 'الأكثر طلباً', fresh: 'جديد', hot: 'حار 🌶', offer: 'عرض',
      unavailable: 'غير متوفر حالياً', offline: 'وضع أوفلاين — نعرض آخر نسخة محفوظة', online: 'عاد الاتصال بالإنترنت',
      confirmClear: 'مسح جميع محتويات السلة؟', closed: 'المطعم مغلق حالياً', ordersOff: 'الطلبات متوقفة حالياً',
      customer: 'الزبون', order: 'طلب جديد', orderNo: 'رقم الطلب', qty: 'العدد', customerLocation: 'موقع الزبون',
      more: n => `+ ${n} خيارات أخرى`, remove: 'حذف', qr: 'QR Code', footerCopy: 'جميع الحقوق محفوظة',
      langNames: { ar: 'العربية', ku: 'کوردی', en: 'English' }
    },
    ku: {
      search: 'لێگەڕان بۆ بەرهەم...', results: n => `${n} ئەنجام`, noResults: 'هیچ بەرهەمێک نەدۆزرایەوە',
      location: 'جهێ مە', call: 'پەیوەندی', whatsapp: 'واتساپی', cart: 'سەبەتە', clear: 'پاککردنەوە',
      emptyCart: 'سەبەتە بەتاڵە', total: 'کۆی گشتی', continue: 'بەردەوامبە', choose: 'هەڵبژێرە', add: 'زیاد بکە',
      chooseHint: 'قەبارە یان هەڵبژاردە هەڵبژێرە', checkout: 'تەواوکردنی داواکاری', name: 'ناڤ', phone: 'ژمارا تەلەفونێ',
      orderType: 'جۆری داواکاری', pickup: 'وەرگرتن', delivery: 'گەیاندن', locate: '📍 جهێ من دیاری بکە', locating: 'جهـ دیار دەکرێت...',
      locationDone: 'جهـ دیارکرا ✓', locationFail: 'نەتوانرا جهـ دیاری بکرێت', notes: 'تێبینی', review: 'پێداچوونەوەی داواکاری',
      send: 'ناردنی داواکاری بە واتساپ', added: 'زیادکرا بۆ سەبەتە', copied: 'لینک کۆپی کرا', share: 'هاوبەشکردن',
      newLabel: 'نوێ', popular: 'زۆرترین داواکراو', fresh: 'نوێ', hot: 'توند 🌶', offer: 'ئۆفەر', unavailable: 'بەردەست نییە',
      offline: 'دۆخی ئۆفلاین — دوایین مینیو نیشان دەدرێت', online: 'ئینتەرنێت گەڕایەوە', confirmClear: 'هەموو سەبەتە پاک بکرێتەوە؟',
      closed: 'چێشتخانەکە داخراوە', ordersOff: 'داواکاری لە ئێستادا وەستاوە', customer: 'کڕیار', order: 'داواکاری نوێ',
      orderNo: 'ژمارەی داواکاری', qty: 'ژمارە', customerLocation: 'جهێ کڕیار', more: n => `+ ${n} هەڵبژاردەی تر`, remove: 'ژێبرن',
      qr: 'QR Code', footerCopy: 'هەموو مافەکان پارێزراون', langNames: { ar: 'العربية', ku: 'کوردی', en: 'English' }
    },
    en: {
      search: 'Search menu...', results: n => `${n} result${n === 1 ? '' : 's'}`, noResults: 'No matching items',
      location: 'Location', call: 'Call', whatsapp: 'WhatsApp', cart: 'Cart', clear: 'Clear', emptyCart: 'Your cart is empty',
      total: 'Total', continue: 'Continue order', choose: 'Choose', add: 'Add', chooseHint: 'Choose a size or option',
      checkout: 'Complete order', name: 'Name', phone: 'Phone number', orderType: 'Order type', pickup: 'Pickup', delivery: 'Delivery',
      locate: '📍 Use my location', locating: 'Locating...', locationDone: 'Location added ✓', locationFail: 'Could not get location — you can continue',
      notes: 'Notes', review: 'Order review', send: 'Send order on WhatsApp', added: 'Added to cart', copied: 'Link copied', share: 'Share',
      newLabel: 'NEW', popular: 'Most Popular', fresh: 'New', hot: 'Spicy 🌶', offer: 'Offer', unavailable: 'Currently unavailable',
      offline: 'Offline mode — showing last saved menu', online: 'Back online', confirmClear: 'Clear the entire cart?', closed: 'Restaurant is currently closed',
      ordersOff: 'Ordering is currently paused', customer: 'Customer', order: 'New order', orderNo: 'Order', qty: 'Qty', customerLocation: 'Customer location',
      more: n => `+ ${n} more options`, remove: 'Remove', qr: 'QR Code', footerCopy: 'All rights reserved',
      langNames: { ar: 'العربية', ku: 'کوردی', en: 'English' }
    }
  };

  const state = {
    config: null,
    menu: null,
    lang: 'ar',
    cart: [],
    query: '',
    activeCategory: '',
    choiceProductId: '',
    orderType: 'pickup',
    customerLocation: '',
    scrollTicking: false,
    bound: false
  };

  const L = key => I18N[state.lang]?.[key] ?? I18N.en[key] ?? key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  const text = value => typeof value === 'string' ? value : (value?.[state.lang] || value?.ar || value?.en || value?.ku || '');
  const cleanPhone = value => String(value || '').replace(/\D/g, '');
  const cartKey = () => `restbr-simple-cart-v3:${state.config?.slug || 'menu'}`;
  const customerKey = () => `restbr-simple-customer-v1:${state.config?.slug || 'menu'}`;
  const menuCacheKey = () => `restbr-simple-menu-cache-v2:${state.config?.slug || 'menu'}`;
  const langKey = () => `restbr-simple-lang:${state.config?.slug || 'menu'}`;

  function normalize(value) {
    return String(value || '').toLowerCase().normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ').trim();
  }

  function money(value) {
    if (value === null || value === undefined || value === '') return '';
    const code = String(state.config?.currency || 'IQD').toUpperCase();
    const n = Number(value) || 0;
    let label = state.config?.currencyLabels?.[state.lang];
    if (!label) label = code === 'IQD' ? (state.lang === 'en' ? 'IQD' : 'د.ع') : code;
    return `${n.toLocaleString('en-US', { maximumFractionDigits: code === 'IQD' ? 0 : 2 })} ${label}`;
  }

  function restaurantName() {
    return text(state.config?.name) || 'SHORASH';
  }

  function subtitle() {
    const raw = text(state.config?.subtitle);
    return raw.replaceAll('{name}', restaurantName());
  }

  function visibleCategories() {
    return (state.menu?.categories || []).filter(c => c.visible !== false);
  }

  function visibleProducts() {
    return (state.menu?.products || []).filter(p => p.visible !== false);
  }

  function productById(id) {
    return visibleProducts().find(p => String(p.id) === String(id));
  }

  function categoryById(id) {
    return visibleCategories().find(c => String(c.id) === String(id));
  }

  function productMatches(p, query) {
    const q = normalize(query);
    if (!q) return true;
    const parts = [p.name?.ar, p.name?.ku, p.name?.en, p.description?.ar, p.description?.ku, p.description?.en];
    const cat = categoryById(p.categoryId);
    if (cat) parts.push(cat.name?.ar, cat.name?.ku, cat.name?.en);
    for (const option of p.options || []) parts.push(option.name?.ar, option.name?.ku, option.name?.en);
    return normalize(parts.filter(Boolean).join(' ')).includes(q);
  }

  function menuFeature(name, fallback = true) {
    const features = state.config?.features || {};
    return features[name] === undefined ? fallback : features[name] !== false;
  }

  function applyTheme() {
    const c = state.config || {};
    const theme = c.theme || {};
    const design = c.design || {};
    const root = document.documentElement.style;
    const pxVars = {
      cardHeight: '--sm-ui-card-height', cardRadius: '--sm-ui-card-radius', cardGap: '--sm-ui-card-gap',
      infoPadding: '--sm-ui-info-padding', productNameFont: '--sm-ui-product-name-font', optionFont: '--sm-ui-option-font',
      priceFont: '--sm-ui-price-font', sectionTitleFont: '--sm-ui-section-title-font', addButtonHeight: '--sm-ui-add-button-height',
      addButtonFont: '--sm-ui-add-button-font', categoryHeight: '--sm-ui-category-height', categoryFont: '--sm-ui-category-font',
      topActionHeight: '--sm-ui-top-action-height', topActionFont: '--sm-ui-top-action-font', cartWidth: '--sm-ui-cart-width',
      cartHeight: '--sm-ui-cart-height', cartFont: '--sm-ui-cart-font', cartBottom: '--sm-ui-cart-bottom', logoSize: '--sm-ui-logo-size',
      menuTitleFont: '--sm-ui-menu-title-font', subtitleFont: '--sm-ui-subtitle-font', searchHeight: '--sm-ui-search-height',
      searchFont: '--sm-ui-search-font', footerTitleFont: '--sm-ui-footer-title-font', footerActionFont: '--sm-ui-footer-action-font',
      footerPhoneFont: '--sm-ui-footer-phone-font'
    };
    if (theme.accent) root.setProperty('--accent', theme.accent);
    if (design.accentColor) root.setProperty('--accent', design.accentColor);
    Object.entries(pxVars).forEach(([key, css]) => {
      const v = Number(design[key] ?? theme[key]);
      if (Number.isFinite(v)) root.setProperty(css, `${v}px`);
    });
    const imagePercent = Number(design.imagePercent ?? theme.imagePercent);
    if (Number.isFinite(imagePercent)) {
      root.setProperty('--sm-ui-image-percent', `${imagePercent}%`);
      root.setProperty('--sm-ui-info-percent', `${100 - imagePercent}%`);
    }
    const cartHorizontal = Number(design.cartHorizontal);
    if (Number.isFinite(cartHorizontal)) root.setProperty('--sm-ui-cart-horizontal', `${cartHorizontal}%`);
    if (design.cardGlassColor) root.setProperty('--glass-rgb', hexToRgb(design.cardGlassColor));
    if (Number.isFinite(Number(design.cardGlassOpacity))) root.setProperty('--glass-opacity', String(Math.max(0, Math.min(100, Number(design.cardGlassOpacity))) / 100));
    if (Number.isFinite(Number(design.cardGlassBlur))) root.setProperty('--glass-blur', `${Math.max(0, Number(design.cardGlassBlur))}px`);
    if (Number.isFinite(Number(design.footerGlassOpacity))) root.setProperty('--footer-opacity', String(Math.max(0, Math.min(100, Number(design.footerGlassOpacity))) / 100));
    if (Number.isFinite(Number(design.footerGlassBlur))) root.setProperty('--footer-blur', `${Math.max(0, Number(design.footerGlassBlur))}px`);
  }

  function hexToRgb(hex) {
    const value = String(hex || '').trim().replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return '8,6,4';
    return `${parseInt(value.slice(0, 2), 16)},${parseInt(value.slice(2, 4), 16)},${parseInt(value.slice(4, 6), 16)}`;
  }

  function applyBackground() {
    const bg = state.config?.background || {};
    const image = $('smBgImage');
    const video = $('smBgVideo');
    image.style.backgroundImage = bg.image ? `url("${String(bg.image).replaceAll('"', '%22')}")` : '';
    if (bg.video) {
      video.src = bg.video;
      video.hidden = false;
      video.play().catch(() => {});
      video.addEventListener('error', () => { video.hidden = true; }, { once: true });
    } else {
      video.hidden = true;
    }
  }

  function renderHeader() {
    const c = state.config;
    document.documentElement.lang = state.lang;
    document.documentElement.dir = RTL.has(state.lang) ? 'rtl' : 'ltr';
    document.title = `${restaurantName()} • Menu`;
    $('smLogo').src = c.logo || '';
    $('smLogo').alt = restaurantName();
    $('smTitle').textContent = restaurantName();
    $('smSubtitle').textContent = subtitle();
    $('smLangCode').textContent = state.lang.toUpperCase();
    $('smSearchInput').placeholder = L('search');

    const langs = c.languages || ['ar', 'ku', 'en'];
    $('smLangs').innerHTML = langs.map(code => `<button type="button" data-lang="${esc(code)}" class="${code === state.lang ? 'active' : ''}">${esc(I18N[state.lang]?.langNames?.[code] || code.toUpperCase())}</button>`).join('');

    const actions = [];
    if (menuFeature('topLocationEnabled', true) && c.locationUrl) actions.push({ type: 'location', href: c.locationUrl, label: c.topLabels?.location?.[state.lang] || L('location'), external: true });
    if (menuFeature('topCallEnabled', true) && c.phone) actions.push({ type: 'call', href: `tel:${c.phone}`, label: c.topLabels?.call?.[state.lang] || L('call') });
    if (menuFeature('topWhatsappEnabled', true) && c.whatsapp) actions.push({ type: 'whatsapp', href: `https://wa.me/${cleanPhone(c.whatsapp)}`, label: c.topLabels?.whatsapp?.[state.lang] || L('whatsapp'), external: true });
    for (const action of c.customTopActions || []) {
      if (action.enabled === false || !action.url) continue;
      actions.push({ type: 'custom', href: action.url, label: text(action.label), external: /^https?:/i.test(action.url), icon: action.icon || '•' });
    }
    $('smActions').innerHTML = actions.map(action => `<a class="sm-action" href="${esc(action.href)}"${action.external ? ' target="_blank" rel="noopener"' : ''}>${actionSvg(action.type, action.icon)}<b>${esc(action.label)}</b></a>`).join('');
  }

  function actionSvg(type, customIcon) {
    if (type === 'location') return '<svg viewBox="0 0 24 24"><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"></path><circle cx="12" cy="10" r="2"></circle></svg>';
    if (type === 'call') return '<svg viewBox="0 0 24 24"><path d="M5 4h3l2 5-2 1.7c1.2 2.4 2.9 4.1 5.3 5.3L15 14l5 2v3c0 1.1-.9 2-2 2C10.3 21 3 13.7 3 6c0-1.1.9-2 2-2Z"></path></svg>';
    if (type === 'whatsapp') return '<svg viewBox="0 0 24 24"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z"></path><path d="M9 8.5c.7 2.7 2.2 4.2 5 5"></path></svg>';
    return `<span aria-hidden="true">${esc(customIcon || '•')}</span>`;
  }

  function renderAnnouncement() {
    const value = text(state.config?.announcement);
    const el = $('smAnnouncement');
    if (!state.config?.announcementEnabled || !value) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    $('smNewsLabel').textContent = L('newLabel');
    const copy = `<span class="sm-news-copy"><span>${esc(value)}</span><i class="sm-news-dot">◆</i><span>${esc(value)}</span><i class="sm-news-dot">◆</i></span>`;
    $('smNewsTrack').innerHTML = copy + copy;
  }

  function renderCategories() {
    const cats = visibleCategories();
    if (!state.activeCategory || !cats.some(c => String(c.id) === String(state.activeCategory))) state.activeCategory = cats[0]?.id || '';
    $('smCats').innerHTML = cats.map(c => `<button class="sm-cat ${String(c.id) === String(state.activeCategory) ? 'active' : ''}" type="button" data-cat="${esc(c.id)}">${esc(text(c.name))}</button>`).join('');
  }

  function renderMenu() {
    const cats = visibleCategories();
    const query = state.query.trim();
    let html = '';
    let total = 0;
    for (const cat of cats) {
      const list = visibleProducts().filter(p => String(p.categoryId) === String(cat.id) && productMatches(p, query));
      if (!list.length) continue;
      total += list.length;
      html += `<section class="sm-section" id="cat-${esc(cat.id)}" data-section-cat="${esc(cat.id)}"><div class="sm-section-head"><h2 class="sm-section-title">${esc(text(cat.name))}</h2><button class="sm-share-category" type="button" data-share-category="${esc(cat.id)}" aria-label="${esc(L('share'))}">↗</button></div><div class="sm-grid">${list.map(p => productCard(p, cat)).join('')}</div></section>`;
    }
    $('smMenu').innerHTML = html || `<div class="sm-empty-menu"><b>⌕</b>${esc(query ? L('noResults') : L('noResults'))}</div>`;
    $('smSearchCount').textContent = query ? L('results')(total) : '';
    installRevealObserver();
  }

  function productCard(p, cat) {
    const options = (p.options || []).filter(o => o.visible !== false);
    const showOptions = options.slice(0, 3);
    const badges = productBadges(p);
    const effect = `${CATEGORY_EFFECTS[String(cat.id)] || ''} ${p.badges?.popular ? 'sm-popular-card' : ''} ${p.badges?.hot ? 'sm-hot-card' : ''}`.trim();
    const image = p.image ? `<img class="sm-product-image" src="${esc(p.image)}" loading="lazy" alt="${esc(text(p.name))}" data-image-product="${esc(p.id)}">` : '<div class="sm-img-placeholder">✦</div>';
    let pricing = '';
    if (options.length) {
      pricing = `<div class="sm-option-list">${showOptions.map(o => `<div class="sm-option"><span>${esc(text(o.name))}</span><b class="sm-price">${esc(money(o.price))}</b></div>`).join('')}${options.length > 3 ? `<div class="sm-more-options">${esc(L('more')(options.length - 3))}</div>` : ''}</div><button class="sm-choose-options" type="button" data-choose="${esc(p.id)}"><span>＋</span>${esc(L('choose'))}</button>`;
    } else {
      pricing = `<div class="sm-option"><span></span><b class="sm-price">${esc(money(p.price))}</b></div><button class="sm-direct-add" type="button" data-add="${esc(p.id)}"><span>＋</span>${esc(L('add'))}</button>`;
    }
    return `<article class="sm-card sm-reveal ${effect}" id="product-${esc(p.id)}" data-product-card="${esc(p.id)}"><div class="sm-info"><h3 class="sm-name">${esc(text(p.name))}</h3>${p.description ? `<div class="sm-desc">${esc(text(p.description))}</div>` : ''}${pricing}</div><div class="sm-img">${image}${badges}<button class="sm-share-product" type="button" data-share-product="${esc(p.id)}" aria-label="${esc(L('share'))}">↗</button></div></article>`;
  }

  function productBadges(p) {
    const b = p.badges || {};
    const rows = [];
    if (b.popular) rows.push(`<span class="sm-display-badge gold">${esc(L('popular'))}</span>`);
    if (b.new || b.fresh) rows.push(`<span class="sm-display-badge gold">${esc(L('fresh'))}</span>`);
    if (b.hot) rows.push(`<span class="sm-display-badge red">${esc(L('hot'))}</span>`);
    if (b.offer) rows.push(`<span class="sm-display-badge offer">${esc(L('offer'))}</span>`);
    return rows.length ? `<div class="sm-badges">${rows.join('')}</div>` : '';
  }

  function installRevealObserver() {
    const cards = $$('.sm-reveal');
    if (!('IntersectionObserver' in window)) {
      cards.forEach(card => card.classList.add('sm-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sm-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '90px 0px', threshold: .04 });
    cards.forEach(card => observer.observe(card));
  }

  function renderFooter() {
    const c = state.config;
    $('smFooterTitle').textContent = restaurantName();
    $('smFooterLocationText').textContent = text(c.footerLocation) || '';
    const actions = [];
    if (c.locationUrl) actions.push({ label: L('location'), href: c.locationUrl, external: true });
    if (c.phone) actions.push({ label: L('call'), href: `tel:${c.phone}` });
    if (c.whatsapp) actions.push({ label: L('whatsapp'), href: `https://wa.me/${cleanPhone(c.whatsapp)}`, external: true });
    $('smFooterActions').innerHTML = actions.map(a => `<a href="${esc(a.href)}"${a.external ? ' target="_blank" rel="noopener"' : ''}>${esc(a.label)}</a>`).join('');

    const socials = (c.socials || []).filter(s => s.enabled !== false && s.url);
    $('smFooterSocials').innerHTML = socials.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label || s.type || 'Social')}</a>`).join('');
    $('smFooterSocials').hidden = !socials.length;
    $('smFooterPhone').textContent = c.phone || '';
    const year = new Date().getFullYear();
    $('smFooterCopy').innerHTML = `${year} © ${esc(restaurantName())} • ${esc(L('footerCopy'))}${c.qrEnabled !== false ? ` • <a href="qr.html" style="color:#aa8d60;text-decoration:none">${esc(L('qr'))}</a>` : ''}`;
    $('smFooter').hidden = menuFeature('showFooter', true) === false;
  }

  function renderAll() {
    renderHeader();
    renderAnnouncement();
    renderCategories();
    renderMenu();
    renderFooter();
    renderCart();
    renderCheckoutLabels();
  }

  function setLanguage(code) {
    if (!(state.config?.languages || []).includes(code)) return;
    state.lang = code;
    localStorage.setItem(langKey(), code);
    try { localStorage.setItem('shorashLang', code); } catch (_) {}
    closePopovers();
    renderAll();
    updateScrollSpy();
  }

  function closePopovers() {
    $('smLangs').classList.remove('open');
    $('smSearchWrap').classList.remove('open');
  }

  function toggleSearch() {
    const opening = !$('smSearchWrap').classList.contains('open');
    closePopovers();
    if (opening) {
      $('smSearchWrap').classList.add('open');
      setTimeout(() => $('smSearchInput').focus(), 30);
    }
  }

  function toggleLanguage() {
    const opening = !$('smLangs').classList.contains('open');
    closePopovers();
    if (opening) $('smLangs').classList.add('open');
  }

  function selectCategory(id, shouldScroll = true) {
    state.activeCategory = id;
    $$('.sm-cat').forEach(btn => btn.classList.toggle('active', String(btn.dataset.cat) === String(id)));
    const btn = $('smCats')?.querySelector(`[data-cat="${cssEscape(id)}"]`);
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    if (shouldScroll) {
      document.getElementById(`cat-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const url = new URL(location.href);
      url.searchParams.set('category', id);
      url.searchParams.delete('product');
      history.replaceState({}, '', url.pathname + url.search + url.hash);
    }
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(String(value));
    return String(value).replace(/["\\]/g, '\\$&');
  }

  function updateScrollSpy() {
    const sections = $$('.sm-section');
    if (!sections.length) return;
    const marker = 110;
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= marker) current = section;
      else break;
    }
    const id = current?.dataset.sectionCat;
    if (id && String(id) !== String(state.activeCategory)) {
      state.activeCategory = id;
      $$('.sm-cat').forEach(btn => btn.classList.toggle('active', String(btn.dataset.cat) === String(id)));
      $('smCats')?.querySelector(`[data-cat="${cssEscape(id)}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const pct = max > 0 ? Math.max(0, Math.min(100, (window.scrollY / max) * 100)) : 0;
    $('smProgress').firstElementChild.style.width = `${pct}%`;
    $('smTopBtn').classList.toggle('show', window.scrollY > 500);
  }

  function onScroll() {
    if (state.scrollTicking) return;
    state.scrollTicking = true;
    requestAnimationFrame(() => {
      updateScrollSpy();
      state.scrollTicking = false;
    });
  }

  function deepLinkUrl(type, id) {
    const url = new URL(location.origin + location.pathname);
    url.searchParams.set(type, id);
    if (type === 'product') url.hash = `product-${id}`;
    return url.toString();
  }

  async function shareUrl(url, title) {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = url;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    toast(L('copied'));
  }

  function shareProduct(id) {
    const p = productById(id);
    if (!p) return;
    return shareUrl(deepLinkUrl('product', id), `${text(p.name)} • ${restaurantName()}`);
  }

  function shareCategory(id) {
    const c = categoryById(id);
    if (!c) return;
    return shareUrl(deepLinkUrl('category', id), `${text(c.name)} • ${restaurantName()}`);
  }

  function openImage(id) {
    const p = productById(id);
    if (!p?.image) return;
    $('smImageFull').src = p.image;
    $('smImageFull').alt = text(p.name);
    $('smImageCaption').textContent = text(p.name);
    $('smImageViewer').classList.add('open');
    $('smImageViewer').setAttribute('aria-hidden', 'false');
    lockBody();
  }

  function closeImage() {
    $('smImageViewer').classList.remove('open');
    $('smImageViewer').setAttribute('aria-hidden', 'true');
    unlockBodyIfClear();
  }

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(cartKey()) || '[]');
      state.cart = Array.isArray(parsed) ? parsed : [];
    } catch (_) { state.cart = []; }
    reconcileCart();
  }

  function reconcileCart() {
    state.cart = state.cart.map(item => {
      const p = productById(item.productId);
      if (!p) return null;
      let option = null;
      if (item.optionId) option = (p.options || []).find(o => String(o.id) === String(item.optionId));
      if (item.optionId && !option) return null;
      return {
        key: `${p.id}:${option?.id || 'base'}`,
        productId: p.id,
        optionId: option?.id || null,
        name: p.name,
        optionName: option?.name || null,
        image: p.image || '',
        price: Number(option?.price ?? p.price ?? 0),
        qty: Math.max(1, Number(item.qty) || 1)
      };
    }).filter(Boolean);
    saveCart(false);
  }

  function saveCart(shouldRender = true) {
    localStorage.setItem(cartKey(), JSON.stringify(state.cart));
    if (shouldRender) renderCart();
  }

  function addItem(product, option = null) {
    if (!canOrder()) return;
    const key = `${product.id}:${option?.id || 'base'}`;
    const found = state.cart.find(item => item.key === key);
    if (found) found.qty += 1;
    else state.cart.push({
      key,
      productId: product.id,
      optionId: option?.id || null,
      name: product.name,
      optionName: option?.name || null,
      image: product.image || '',
      price: Number(option?.price ?? product.price ?? 0),
      qty: 1
    });
    saveCart();
    toast(`${L('added')} • ${text(product.name)}`);
  }

  function canOrder(showMessage = true) {
    if (!menuFeature('isOpen', true)) {
      if (showMessage) toast(text(state.config?.closedMessage) || L('closed'));
      return false;
    }
    if (!menuFeature('ordersEnabled', true)) {
      if (showMessage) toast(L('ordersOff'));
      return false;
    }
    return true;
  }

  function cartTotal() {
    return state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function renderCart() {
    const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
    $('smCartFab').hidden = count === 0;
    $('smCartFab').classList.toggle('has-items', count > 0);
    $('smCartFabText').textContent = L('cart');
    $('smCartCount').textContent = count;
    $('smCartTitle').textContent = L('cart');
    $('smCartClear').textContent = L('clear');
    $('smCartClear').disabled = !state.cart.length;
    $('smCartTotalLabel').textContent = L('total');
    $('smCartContinue').textContent = L('continue');
    $('smCartTotal').textContent = money(cartTotal());
    if (!state.cart.length) {
      $('smCartItems').innerHTML = `<div class="sm-cart-empty"><div>🛒</div>${esc(L('emptyCart'))}</div>`;
      return;
    }
    $('smCartItems').innerHTML = state.cart.map((item, index) => `<div class="sm-cart-item" data-cart-index="${index}">${item.image ? `<img src="${esc(item.image)}" alt="">` : '<div class="sm-cart-thumb"></div>'}<div class="sm-cart-item-info"><strong>${esc(text(item.name))}</strong><small>${item.optionName ? esc(text(item.optionName)) : ''}</small><b>${esc(money(item.price))}</b></div><div class="sm-cart-qty"><button type="button" data-minus="${index}">−</button><span>${item.qty}</span><button type="button" data-plus="${index}">＋</button></div><button class="sm-cart-remove" type="button" data-remove="${index}" aria-label="${esc(L('remove'))}">×</button></div>`).join('');
  }

  function openCart() {
    $('smCartBackdrop').classList.add('open');
    $('smCartDrawer').classList.add('open');
    $('smCartDrawer').setAttribute('aria-hidden', 'false');
    lockBody();
  }

  function closeCart() {
    $('smCartBackdrop').classList.remove('open');
    $('smCartDrawer').classList.remove('open');
    $('smCartDrawer').setAttribute('aria-hidden', 'true');
    unlockBodyIfClear();
  }

  function openChoice(id) {
    const p = productById(id);
    if (!p) return;
    const options = (p.options || []).filter(o => o.visible !== false);
    if (!options.length) return addItem(p);
    state.choiceProductId = p.id;
    $('smChoiceHint').textContent = L('chooseHint');
    $('smChoiceTitle').textContent = text(p.name);
    $('smChoiceList').innerHTML = options.map(o => `<button class="sm-choice-option" type="button" data-option-id="${esc(o.id)}"><span>${esc(text(o.name))}</span><b>${esc(money(o.price))}</b><i>＋</i></button>`).join('');
    $('smChoiceBackdrop').classList.add('open');
    $('smChoiceSheet').classList.add('open');
    $('smChoiceSheet').setAttribute('aria-hidden', 'false');
    lockBody();
  }

  function closeChoice() {
    $('smChoiceBackdrop').classList.remove('open');
    $('smChoiceSheet').classList.remove('open');
    $('smChoiceSheet').setAttribute('aria-hidden', 'true');
    state.choiceProductId = '';
    unlockBodyIfClear();
  }

  function loadCustomer() {
    try {
      const data = JSON.parse(localStorage.getItem(customerKey()) || '{}');
      $('smCustomerName').value = data.name || '';
      $('smCustomerPhone').value = data.phone || '';
      $('smCustomerNotes').value = '';
      state.orderType = data.orderType || (menuFeature('pickupEnabled', true) ? 'pickup' : 'delivery');
    } catch (_) {}
  }

  function saveCustomer() {
    localStorage.setItem(customerKey(), JSON.stringify({
      name: $('smCustomerName').value.trim(),
      phone: $('smCustomerPhone').value.trim(),
      orderType: state.orderType
    }));
  }

  function openCheckout() {
    if (!state.cart.length || !canOrder()) return;
    closeCart();
    loadCustomer();
    const pickup = menuFeature('pickupEnabled', true);
    const delivery = menuFeature('deliveryEnabled', true);
    if (!pickup && delivery) state.orderType = 'delivery';
    if (pickup && !delivery) state.orderType = 'pickup';
    updateOrderTypes();
    renderCheckoutReview();
    $('smCheckoutBackdrop').classList.add('open');
    $('smCheckoutSheet').classList.add('open');
    $('smCheckoutSheet').setAttribute('aria-hidden', 'false');
    lockBody();
  }

  function closeCheckout() {
    $('smCheckoutBackdrop').classList.remove('open');
    $('smCheckoutSheet').classList.remove('open');
    $('smCheckoutSheet').setAttribute('aria-hidden', 'true');
    unlockBodyIfClear();
  }

  function renderCheckoutLabels() {
    $('smCheckoutTitle').textContent = L('checkout');
    $('smNameLabel').textContent = L('name');
    $('smPhoneLabel').textContent = L('phone');
    $('smOrderTypeLabel').textContent = L('orderType');
    $('smNotesLabel').textContent = L('notes');
    $('smLocationBtn').textContent = L('locate');
    $('smSendOrder').textContent = L('send');
    updateOrderTypes();
  }

  function updateOrderTypes() {
    const pickup = menuFeature('pickupEnabled', true);
    const delivery = menuFeature('deliveryEnabled', true);
    const buttons = $$('#smOrderTypes [data-order-type]');
    buttons.forEach(btn => {
      const type = btn.dataset.orderType;
      btn.hidden = type === 'pickup' ? !pickup : !delivery;
      btn.textContent = type === 'pickup' ? L('pickup') : L('delivery');
      btn.classList.toggle('active', type === state.orderType);
    });
    $('smLocationBtn').hidden = state.orderType !== 'delivery';
    $('smLocationStatus').hidden = state.orderType !== 'delivery';
  }

  function renderCheckoutReview() {
    $('smCheckoutReview').innerHTML = `<h4>${esc(L('review'))}</h4>${state.cart.map(item => `<div class="sm-review-item"><span>${esc(text(item.name))}${item.optionName ? `<small>${esc(text(item.optionName))}</small>` : ''} × ${item.qty}</span><b>${esc(money(item.price * item.qty))}</b></div>`).join('')}<div class="sm-checkout-review-total"><span>${esc(L('total'))}</span><b>${esc(money(cartTotal()))}</b></div>`;
  }

  function locateCustomer() {
    if (!navigator.geolocation) {
      $('smLocationStatus').textContent = L('locationFail');
      return;
    }
    $('smLocationBtn').disabled = true;
    $('smLocationBtn').textContent = L('locating');
    navigator.geolocation.getCurrentPosition(position => {
      const lat = Number(position.coords.latitude).toFixed(6);
      const lng = Number(position.coords.longitude).toFixed(6);
      state.customerLocation = `https://maps.google.com/?q=${lat},${lng}`;
      $('smLocationStatus').textContent = L('locationDone');
      $('smLocationBtn').disabled = false;
      $('smLocationBtn').textContent = L('locate');
    }, () => {
      $('smLocationStatus').textContent = L('locationFail');
      $('smLocationBtn').disabled = false;
      $('smLocationBtn').textContent = L('locate');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 120000 });
  }

  function orderNumber() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${String(state.config?.slug || 'RESTBR').toUpperCase()}-${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  }

  function sendOrder() {
    if (!state.cart.length || !canOrder()) return;
    const whatsapp = cleanPhone(state.config?.whatsapp);
    if (!whatsapp) return toast('WhatsApp number missing');
    saveCustomer();
    const name = $('smCustomerName').value.trim();
    const phone = $('smCustomerPhone').value.trim();
    const notes = $('smCustomerNotes').value.trim();
    const number = orderNumber();
    const lines = [
      `*${L('order')} - ${restaurantName()}*`,
      `${L('orderNo')}: ${number}`,
      ''
    ];
    if (name) lines.push(`${L('name')}: ${name}`);
    if (phone) lines.push(`${L('phone')}: ${phone}`);
    lines.push(`${L('orderType')}: ${state.orderType === 'delivery' ? L('delivery') : L('pickup')}`);
    if (state.orderType === 'delivery' && state.customerLocation) lines.push(`${L('customerLocation')}: ${state.customerLocation}`);
    lines.push('');
    state.cart.forEach((item, i) => {
      lines.push(`${i + 1}) ${text(item.name)}${item.optionName ? ` - ${text(item.optionName)}` : ''} × ${item.qty} = ${money(item.price * item.qty)}`);
    });
    lines.push('', `${L('total')}: *${money(cartTotal())}*`);
    if (notes) lines.push('', `${L('notes')}: ${notes}`);
    location.href = `https://wa.me/${whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
  }

  function toast(message) {
    const el = $('smToast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function lockBody() {
    document.body.classList.add('sm-lock');
  }

  function unlockBodyIfClear() {
    const open = document.querySelector('.sm-cart-drawer.open, .sm-choice-sheet.open, .sm-checkout-sheet.open, .sm-image-viewer.open');
    if (!open) document.body.classList.remove('sm-lock');
  }

  function applyDeepLinkBeforeRender() {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    const productId = params.get('product');
    const categoryId = params.get('category');
    if (q) {
      state.query = q;
      $('smSearchInput').value = q;
    }
    if (productId) {
      const p = productById(productId);
      if (p) state.activeCategory = p.categoryId;
    } else if (categoryId && categoryById(categoryId)) {
      state.activeCategory = categoryId;
    }
  }

  function scrollToDeepLink() {
    const id = new URLSearchParams(location.search).get('product');
    if (!id) return;
    const locate = () => {
      const card = document.querySelector(`[data-product-card="${cssEscape(id)}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('sm-deep-highlight');
      setTimeout(() => card.classList.remove('sm-deep-highlight'), 2300);
    };
    setTimeout(locate, 250);
  }

  function installGlobalEvents() {
    if (state.bound) return;
    state.bound = true;

    $('smSearchToggle').addEventListener('click', event => { event.stopPropagation(); toggleSearch(); });
    $('smLangToggle').addEventListener('click', event => { event.stopPropagation(); toggleLanguage(); });
    $('smSearchWrap').addEventListener('click', event => event.stopPropagation());
    $('smLangs').addEventListener('click', event => {
      event.stopPropagation();
      const btn = event.target.closest('[data-lang]');
      if (btn) setLanguage(btn.dataset.lang);
    });
    $('smSearchClear').addEventListener('click', () => {
      state.query = '';
      $('smSearchInput').value = '';
      $('smSearchWrap').classList.remove('open');
      renderMenu();
    });
    $('smSearchInput').addEventListener('input', event => {
      state.query = event.target.value;
      renderMenu();
    });
    document.addEventListener('click', closePopovers);

    $('smCats').addEventListener('click', event => {
      const btn = event.target.closest('[data-cat]');
      if (btn) selectCategory(btn.dataset.cat, true);
    });

    $('smMenu').addEventListener('click', event => {
      const add = event.target.closest('[data-add]');
      const choose = event.target.closest('[data-choose]');
      const shareP = event.target.closest('[data-share-product]');
      const shareC = event.target.closest('[data-share-category]');
      const image = event.target.closest('[data-image-product]');
      if (add) return addItem(productById(add.dataset.add));
      if (choose) return openChoice(choose.dataset.choose);
      if (shareP) return shareProduct(shareP.dataset.shareProduct);
      if (shareC) return shareCategory(shareC.dataset.shareCategory);
      if (image) return openImage(image.dataset.imageProduct);
    });

    $('smCartFab').addEventListener('click', openCart);
    $('smCartClose').addEventListener('click', closeCart);
    $('smCartBackdrop').addEventListener('click', closeCart);
    $('smCartClear').addEventListener('click', () => {
      if (!state.cart.length) return;
      if (!confirm(L('confirmClear'))) return;
      state.cart = [];
      saveCart();
      closeCart();
    });
    $('smCartItems').addEventListener('click', event => {
      const plus = event.target.closest('[data-plus]');
      const minus = event.target.closest('[data-minus]');
      const remove = event.target.closest('[data-remove]');
      if (plus) state.cart[Number(plus.dataset.plus)].qty += 1;
      else if (minus) {
        const i = Number(minus.dataset.minus);
        state.cart[i].qty -= 1;
        if (state.cart[i].qty <= 0) state.cart.splice(i, 1);
      } else if (remove) state.cart.splice(Number(remove.dataset.remove), 1);
      else return;
      saveCart();
    });
    $('smCartContinue').addEventListener('click', openCheckout);

    $('smChoiceClose').addEventListener('click', closeChoice);
    $('smChoiceBackdrop').addEventListener('click', closeChoice);
    $('smChoiceList').addEventListener('click', event => {
      const btn = event.target.closest('[data-option-id]');
      if (!btn) return;
      const p = productById(state.choiceProductId);
      const o = (p?.options || []).find(option => String(option.id) === String(btn.dataset.optionId));
      if (p && o) addItem(p, o);
      closeChoice();
    });

    $('smImageClose').addEventListener('click', closeImage);
    $('smImageViewer').addEventListener('click', event => { if (event.target === $('smImageViewer')) closeImage(); });

    $('smCheckoutClose').addEventListener('click', closeCheckout);
    $('smCheckoutBackdrop').addEventListener('click', closeCheckout);
    $('smOrderTypes').addEventListener('click', event => {
      const btn = event.target.closest('[data-order-type]');
      if (!btn) return;
      state.orderType = btn.dataset.orderType;
      state.customerLocation = '';
      $('smLocationStatus').textContent = '';
      updateOrderTypes();
    });
    $('smLocationBtn').addEventListener('click', locateCustomer);
    $('smSendOrder').addEventListener('click', sendOrder);

    $('smTopBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    window.addEventListener('offline', () => showNetworkBanner(L('offline')));
    window.addEventListener('online', () => showNetworkBanner(L('online')));
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      closePopovers(); closeImage(); closeChoice(); closeCart(); closeCheckout();
    });
  }

  function showNetworkBanner(message) {
    const el = $('smOfflineBanner');
    el.textContent = message;
    el.hidden = false;
    clearTimeout(showNetworkBanner.timer);
    showNetworkBanner.timer = setTimeout(() => { el.hidden = true; }, 4200);
  }

  function startIntro() {
    const enabled = state.config?.introEnabled !== false;
    const intro = $('smIntro');
    if (!enabled) {
      intro.classList.add('done');
      return;
    }
    $('smIntroLogo').src = state.config?.logo || '';
    $('smIntroBrand').textContent = restaurantName();
    const duration = Math.max(350, Math.min(2500, Number(state.config?.introDurationMs) || 800));
    setTimeout(() => intro.classList.add('done'), duration);
  }

  function cacheMenu(menu) {
    try { localStorage.setItem(menuCacheKey(), JSON.stringify({ savedAt: Date.now(), menu })); } catch (_) {}
  }

  function cachedMenu() {
    try {
      const parsed = JSON.parse(localStorage.getItem(menuCacheKey()) || 'null');
      return parsed?.menu && Array.isArray(parsed.menu.products) ? parsed.menu : null;
    } catch (_) { return null; }
  }

  function registerPwa() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}), { once: true });
  }

  async function load() {
    try {
      const configResponse = await fetch('data/restaurant.json', { cache: 'no-store' });
      if (!configResponse.ok) throw new Error('Restaurant config not found');
      state.config = await configResponse.json();
      state.lang = localStorage.getItem(langKey()) || localStorage.getItem('shorashLang') || state.config.defaultLanguage || state.config.languages?.[0] || 'ar';
      if (!(state.config.languages || ['ar']).includes(state.lang)) state.lang = state.config.defaultLanguage || 'ar';
      applyTheme();
      applyBackground();

      try {
        const menuResponse = await fetch('data/menu.json', { cache: 'no-store' });
        if (!menuResponse.ok) throw new Error(`Menu HTTP ${menuResponse.status}`);
        state.menu = await menuResponse.json();
        cacheMenu(state.menu);
      } catch (error) {
        state.menu = cachedMenu();
        if (!state.menu) throw error;
        setTimeout(() => showNetworkBanner(L('offline')), 500);
      }

      applyDeepLinkBeforeRender();
      loadCart();
      installGlobalEvents();
      renderAll();
      startIntro();
      updateScrollSpy();
      scrollToDeepLink();
      registerPwa();
    } catch (error) {
      console.error('RESTBR Simple failed', error);
      document.body.innerHTML = '<div style="min-height:100vh;display:grid;place-items:center;padding:30px;background:#070503;color:#d8a958;text-align:center;font-family:system-ui">RESTBR<br><small style="color:#aaa;margin-top:8px">Menu could not be loaded</small></div>';
    }
  }

  load();
})();
