(() => {
  'use strict';

  const originalFetch = window.fetch.bind(window);
  const source = {
    categories: 'https://raw.githubusercontent.com/hamodybr/restbr-menu-app/main/migration/shorash/categories.json',
    products: 'https://raw.githubusercontent.com/hamodybr/restbr-menu-app/main/migration/shorash/products.json',
    options: 'https://raw.githubusercontent.com/hamodybr/restbr-menu-app/main/migration/shorash/product_options.json'
  };

  const asText = value => value == null ? '' : String(value);
  const names = row => ({
    ar: asText(row.name_ar),
    ku: asText(row.name_ku),
    en: asText(row.name_en)
  });

  function baghdadMinutesNow() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Baghdad',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    const hour = Number(parts.find(p => p.type === 'hour')?.value || 0) % 24;
    const minute = Number(parts.find(p => p.type === 'minute')?.value || 0);
    return hour * 60 + minute;
  }

  function clockMinutes(value) {
    if (!value) return null;
    const [h, m] = String(value).split(':').map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
  }

  function scheduleAllows(row) {
    if (!row?.availability_schedule_enabled) return true;
    const from = clockMinutes(row.available_from);
    const to = clockMinutes(row.available_to);
    if (from == null || to == null) return true;
    const now = baghdadMinutesNow();
    return from <= to ? now >= from && now <= to : now >= from || now <= to;
  }

  async function json(url) {
    const response = await originalFetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Shorash static data failed: ${response.status}`);
    return response.json();
  }

  async function buildMenu() {
    const [categoriesRaw, productsRaw, optionsRaw] = await Promise.all([
      json(source.categories),
      json(source.products),
      json(source.options)
    ]);

    const optionsByProduct = new Map();
    [...optionsRaw]
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
      .forEach(option => {
        if (option.is_active === false || option.is_available === false) return;
        const list = optionsByProduct.get(option.product_id) || [];
        list.push({
          id: option.id,
          name: names(option),
          price: Number(option.price) || 0,
          visible: true
        });
        optionsByProduct.set(option.product_id, list);
      });

    const categories = [...categoriesRaw]
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
      .map(category => ({
        id: category.id,
        name: names(category),
        visible: category.is_active !== false && category.is_visible !== false && scheduleAllows(category)
      }));

    const products = [...productsRaw]
      .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
      .map(product => {
        const productOptions = optionsByProduct.get(product.id) || [];
        const description = {
          ar: asText(product.description_ar),
          ku: asText(product.description_ku),
          en: asText(product.description_en)
        };
        const hasDescription = Object.values(description).some(Boolean);
        const declaredOptions = product.has_options === true;
        const available = product.is_active !== false &&
          product.is_visible !== false &&
          product.is_available !== false &&
          scheduleAllows(product) &&
          (!declaredOptions || productOptions.length > 0);

        return {
          id: product.id,
          categoryId: product.category_id,
          name: names(product),
          description: hasDescription ? description : null,
          image: asText(product.image_url),
          price: Number(product.base_price) || 0,
          visible: available,
          options: productOptions
        };
      });

    return { categories, products };
  }

  let menuPromise = null;
  window.fetch = async function restbrShorashFetch(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (!/(^|\/)data\/menu\.json(?:[?#].*)?$/.test(url)) {
      return originalFetch(input, init);
    }

    try {
      menuPromise ||= buildMenu();
      const menu = await menuPromise;
      return new Response(JSON.stringify(menu), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    } catch (error) {
      console.error('RESTBR Simple Shorash data bridge failed', error);
      throw error;
    }
  };

  console.log('✅ RESTBR Simple Shorash static data bridge ready');
})();
