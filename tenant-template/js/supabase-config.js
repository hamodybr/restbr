// RESTBR Multi-Tenant compatibility preamble for the original restbr-menu-app.
// This file replaces only the connection section of the original supabase-config.js.
// Every restaurant keeps the exact original UI/runtime while data is scoped by restaurant_id.

const SUPABASE_URL = 'https://xdqewaapwhmqlfotaofg.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_dOGkocLtn1WVvrxmu6TnJQ_8qyPyV-T';

function restbrResolveTenantContext(){
  const params = new URLSearchParams(location.search);
  let restaurantId = String(params.get('rid') || params.get('restaurant_id') || '').trim();
  let slug = String(params.get('tenant') || '').trim().toLowerCase();

  // Normal restaurant URLs are resolved by the Cloudflare router. Until the
  // router injects rid directly into every HTML request, use its health endpoint
  // as a synchronous first-load compatibility fallback.
  if(!restaurantId && !/^(?:localhost|127\.0\.0\.1)$/i.test(location.hostname)){
    try{
      const xhr = new XMLHttpRequest();
      xhr.open('GET','/_restbr/health',false);
      xhr.setRequestHeader('accept','application/json');
      xhr.send(null);
      if(xhr.status >= 200 && xhr.status < 300){
        const payload = JSON.parse(xhr.responseText || '{}');
        restaurantId = String(payload?.restaurant?.id || '').trim();
        slug = slug || String(payload?.restaurant?.slug || '').trim().toLowerCase();
      }
    }catch(error){
      console.warn('RESTBR tenant health fallback failed:', error);
    }
  }

  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(restaurantId)){
    throw new Error('RESTBR tenant context missing. Open this page from the restaurant domain or include ?rid=<restaurant_uuid>.');
  }

  return Object.freeze({ restaurantId, slug });
}

const RESTBR_TENANT_CONTEXT = restbrResolveTenantContext();
window.RESTBR_TENANT_CONTEXT = RESTBR_TENANT_CONTEXT;
window.RESTBR_TENANT_ID = RESTBR_TENANT_CONTEXT.restaurantId;

const __restbrRawSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } }
);
window.__RESTBR_RAW_SUPABASE__ = __restbrRawSupabase;

const __restbrTenantTables = new Set([
  'categories','products','product_options','discounts','orders','order_items',
  'menu_analytics_daily','restaurant_settings','restaurant_members','audit_logs'
]);

function __restbrRowsWithTenant(value){
  const rid = RESTBR_TENANT_CONTEXT.restaurantId;
  if(Array.isArray(value)) return value.map(row => ({ ...(row || {}), restaurant_id: rid }));
  return { ...(value || {}), restaurant_id: rid };
}

function __restbrPatchWithoutTenant(value){
  if(!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const patch = { ...value };
  delete patch.restaurant_id;
  return patch;
}

function __restbrScopedRelation(table){
  const relation = __restbrRawSupabase.from(table);
  if(!__restbrTenantTables.has(table)) return relation;
  const rid = RESTBR_TENANT_CONTEXT.restaurantId;

  return new Proxy(relation, {
    get(target, prop){
      if(prop === 'select'){
        return (...args) => target.select(...args).eq('restaurant_id', rid);
      }
      if(prop === 'update'){
        return (patch, ...args) => target.update(__restbrPatchWithoutTenant(patch), ...args).eq('restaurant_id', rid);
      }
      if(prop === 'delete'){
        return (...args) => target.delete(...args).eq('restaurant_id', rid);
      }
      if(prop === 'insert'){
        return (rows, ...args) => target.insert(__restbrRowsWithTenant(rows), ...args);
      }
      if(prop === 'upsert'){
        return (rows, ...args) => target.upsert(__restbrRowsWithTenant(rows), ...args);
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}

function __restbrScopedPath(path=''){
  const rid = RESTBR_TENANT_CONTEXT.restaurantId;
  const clean = String(path || '').replace(/^\/+/, '');
  if(clean === rid || clean.startsWith(rid + '/')) return clean;
  return clean ? `${rid}/${clean}` : rid;
}

function __restbrStorageBucket(bucket){
  const raw = __restbrRawSupabase.storage.from(bucket);
  if(bucket !== 'menu-images') return raw;

  return new Proxy(raw, {
    get(target, prop){
      if(['upload','update','download','getPublicUrl','createSignedUrl','createSignedUrls'].includes(prop)){
        return (path, ...args) => target[prop](__restbrScopedPath(path), ...args);
      }
      if(prop === 'remove'){
        return (paths, ...args) => target.remove((paths || []).map(__restbrScopedPath), ...args);
      }
      if(prop === 'list'){
        return (path='', ...args) => target.list(__restbrScopedPath(path), ...args);
      }
      if(prop === 'move' || prop === 'copy'){
        return (from, to, ...args) => target[prop](__restbrScopedPath(from), __restbrScopedPath(to), ...args);
      }
      const value = target[prop];
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}

const supabaseClient = new Proxy(__restbrRawSupabase, {
  get(target, prop){
    if(prop === 'from') return table => __restbrScopedRelation(String(table));
    if(prop === 'rpc'){
      return (fn, args={}, options={}) => {
        const payload = { ...(args || {}) };
        if(fn === 'track_menu_event' || fn === 'adjust_menu_prices'){
          payload.p_restaurant_id = RESTBR_TENANT_CONTEXT.restaurantId;
        }
        return target.rpc(fn, payload, options);
      };
    }
    if(prop === 'storage'){
      return new Proxy(target.storage, {
        get(storageTarget, storageProp){
          if(storageProp === 'from') return bucket => __restbrStorageBucket(String(bucket));
          const value = storageTarget[storageProp];
          return typeof value === 'function' ? value.bind(storageTarget) : value;
        }
      });
    }
    const value = target[prop];
    return typeof value === 'function' ? value.bind(target) : value;
  }
});

window.supabaseClient = supabaseClient;
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_PUBLISHABLE_KEY = SUPABASE_PUBLISHABLE_KEY;

console.log('✅ RESTBR tenant Supabase connected', RESTBR_TENANT_CONTEXT);
// Load the shared menu-language policy for both the public menu and admin.
(() => {
  if (document.getElementById('shorashLanguageSettingsScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashLanguageSettingsScript';
  script.src = 'js/language-settings.js?v=1.1';
  script.async = false;
  document.head.appendChild(script);
})();

// Public-menu only: keep the open options sheet synced after live price refreshes.
(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashDiscountChoicePriceSyncScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashDiscountChoicePriceSyncScript';
  script.src = 'js/discount-choice-price-sync.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Public-menu only: automatic restaurant opening hours.
(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashRestaurantHoursScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashRestaurantHoursScript';
  script.src = 'js/restaurant-hours.js?v=1.3';
  script.async = false;
  document.head.appendChild(script);
})();

// Public-menu only: use bullets instead of numeric sequencing in WhatsApp order items.
(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashWhatsappOrderBulletsScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashWhatsappOrderBulletsScript';
  script.src = 'js/whatsapp-order-bullets.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only sticky toolbar + GLOBAL dashboard light/dark theme.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminThemeToolbarScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminThemeToolbarScript';
  script.src = 'js/admin-theme-toolbar.js?v=1.1';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only: slightly increase all dashboard text without changing layout sizing.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminFontScaleScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminFontScaleScript';
  script.src = 'js/admin-font-scale.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only native category filter inside the existing products filter system.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminProductCategoryFilterScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminProductCategoryFilterScript';
  script.src = 'js/admin-product-category-filter.js?v=2.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only dine-in / takeaway price controls for product options.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminTakeawayPricesScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminTakeawayPricesScript';
  script.src = 'js/admin-takeaway-prices.js?v=1.1';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only tap ordering for product options inside the product editor.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminOptionOrderScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminOptionOrderScript';
  script.src = 'js/admin-option-order.js?v=1.4';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only: use the current restaurant logo when a product has no image.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminProductImageFallbackScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminProductImageFallbackScript';
  script.src = 'js/admin-product-image-fallback.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only: choose which price type a bulk change targets.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminBulkPriceTargetUiScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminBulkPriceTargetUiScript';
  script.src = 'js/admin-bulk-price-target-ui.js?v=2.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only: enhanced full backup includes discounts too.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminFullBackupDiscountsScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminFullBackupDiscountsScript';
  script.src = 'js/admin-full-backup-discounts.js?v=1.1';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only: restore discounts from enhanced backups too.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminFullRestoreDiscountsScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminFullRestoreDiscountsScript';
  script.src = 'js/admin-full-restore-discounts.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only: include dine-in and takeaway prices in Excel export.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminExcelExportTakeawayScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminExcelExportTakeawayScript';
  script.src = 'js/admin-excel-export-takeaway.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only: allow takeaway_price updates during Excel import.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminExcelImportTakeawayScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminExcelImportTakeawayScript';
  script.src = 'js/admin-excel-import-takeaway.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only restaurant opening-hours editor.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminRestaurantHoursScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminRestaurantHoursScript';
  script.src = 'js/admin-restaurant-hours.js?v=1.2';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only editor for the first dine-in / takeaway choice window.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminDiningGateSettingsScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminDiningGateSettingsScript';
  script.src = 'js/admin-dining-gate-settings.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Admin-only simple percentage discount manager.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminDiscountsScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminDiscountsScript';
  script.src = 'js/admin-discounts.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// Final admin-only light-theme completion layer for hard-coded dark components.
(() => {
  if (!/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (document.getElementById('shorashAdminLightThemeCompleteScript')) return;

  const script = document.createElement('script');
  script.id = 'shorashAdminLightThemeCompleteScript';
  script.src = 'js/admin-light-theme-complete.js?v=1.0';
  script.async = false;
  document.head.appendChild(script);
})();

// ==========================================
// SHORASH MENU — Supabase Connection Test
// ==========================================

async function testSupabaseConnection() {
  try {
    console.log('🔄 Testing Supabase connection...');

    const { data, error } = await supabaseClient
      .from('restaurant_settings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Supabase test failed:', error);
      return;
    }

    console.log('✅ SUPABASE CONNECTION SUCCESS');
    console.log('📦 Restaurant settings:', data);

  } catch (error) {
    console.error('❌ Supabase connection error:', error);
  }
}

testSupabaseConnection();