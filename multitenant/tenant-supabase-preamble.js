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
