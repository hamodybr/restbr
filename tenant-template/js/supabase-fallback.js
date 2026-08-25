(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (window.supabase?.createClient) return;
  if (window.__RESTBR_SUPABASE_FALLBACK_V1__) return;
  window.__RESTBR_SUPABASE_FALLBACK_V1__ = true;

  const FALLBACK_URL = 'https://xdqewaapwhmqlfotaofg.supabase.co';
  const FALLBACK_KEY = 'sb_publishable_dOGkocLtn1WVvrxmu6TnJQ_8qyPyV-T';

  const asError = (message, status = 0, details = '') => ({
    message: String(message || 'Supabase request failed'),
    status,
    details: String(details || ''),
    hint: '',
    code: status ? `HTTP_${status}` : 'RESTBR_FETCH_ERROR'
  });

  class RestbrQuery {
    constructor(baseUrl, key, table) {
      this.baseUrl = baseUrl.replace(/\/$/, '');
      this.key = key;
      this.table = table;
      this.method = 'GET';
      this.params = new URLSearchParams();
      this.body = undefined;
      this.headers = {};
      this.singleMode = '';
      this._promise = null;
    }

    select(columns = '*') {
      this.params.set('select', String(columns || '*'));
      if (this.method !== 'GET') {
        this.headers.Prefer = this.headers.Prefer
          ? `${this.headers.Prefer},return=representation`
          : 'return=representation';
      }
      return this;
    }

    eq(column, value) {
      this.params.append(String(column), `eq.${String(value)}`);
      return this;
    }

    neq(column, value) {
      this.params.append(String(column), `neq.${String(value)}`);
      return this;
    }

    is(column, value) {
      this.params.append(String(column), `is.${String(value)}`);
      return this;
    }

    gt(column, value) {
      this.params.append(String(column), `gt.${String(value)}`);
      return this;
    }

    gte(column, value) {
      this.params.append(String(column), `gte.${String(value)}`);
      return this;
    }

    lt(column, value) {
      this.params.append(String(column), `lt.${String(value)}`);
      return this;
    }

    lte(column, value) {
      this.params.append(String(column), `lte.${String(value)}`);
      return this;
    }

    in(column, values) {
      const list = Array.isArray(values) ? values : [];
      const encoded = list.map(value => {
        const raw = String(value ?? '');
        return /[(),\s]/.test(raw) ? `"${raw.replaceAll('"', '\\"')}"` : raw;
      }).join(',');
      this.params.append(String(column), `in.(${encoded})`);
      return this;
    }

    order(column, options = {}) {
      const ascending = options?.ascending !== false;
      let value = `${String(column)}.${ascending ? 'asc' : 'desc'}`;
      if (options?.nullsFirst === true) value += '.nullsfirst';
      if (options?.nullsFirst === false) value += '.nullslast';
      this.params.append('order', value);
      return this;
    }

    limit(value) {
      const n = Math.max(0, Number(value) || 0);
      this.params.set('limit', String(n));
      return this;
    }

    range(from, to) {
      const start = Math.max(0, Number(from) || 0);
      const end = Math.max(start, Number(to) || start);
      this.headers.Range = `${start}-${end}`;
      return this;
    }

    maybeSingle() {
      this.singleMode = 'maybe';
      return this._execute();
    }

    single() {
      this.singleMode = 'single';
      return this._execute();
    }

    update(values) {
      this.method = 'PATCH';
      this.body = values ?? {};
      return this;
    }

    insert(values) {
      this.method = 'POST';
      this.body = values;
      return this;
    }

    upsert(values, options = {}) {
      this.method = 'POST';
      this.body = values;
      const parts = ['resolution=merge-duplicates'];
      if (options?.ignoreDuplicates) parts[0] = 'resolution=ignore-duplicates';
      this.headers.Prefer = parts.join(',');
      if (options?.onConflict) this.params.set('on_conflict', String(options.onConflict));
      return this;
    }

    delete() {
      this.method = 'DELETE';
      return this;
    }

    then(resolve, reject) {
      return this._execute().then(resolve, reject);
    }

    catch(reject) {
      return this._execute().catch(reject);
    }

    finally(handler) {
      return this._execute().finally(handler);
    }

    _execute() {
      if (this._promise) return this._promise;

      this._promise = (async () => {
        const url = new URL(`${this.baseUrl}/rest/v1/${encodeURIComponent(this.table)}`);
        this.params.forEach((value, name) => url.searchParams.append(name, value));

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);

        try {
          const headers = {
            apikey: this.key,
            Authorization: `Bearer ${this.key}`,
            Accept: 'application/json',
            ...this.headers
          };

          const init = {
            method: this.method,
            cache: 'no-store',
            signal: controller.signal,
            headers
          };

          if (this.body !== undefined) {
            headers['Content-Type'] = 'application/json';
            init.body = JSON.stringify(this.body);
          }

          const response = await fetch(url.toString(), init);
          const raw = await response.text();
          let payload = null;

          if (raw) {
            try { payload = JSON.parse(raw); }
            catch (_) { payload = raw; }
          }

          if (!response.ok) {
            const message = payload?.message || payload?.error || raw || `HTTP ${response.status}`;
            return {
              data: null,
              error: asError(message, response.status, payload?.details || ''),
              count: null,
              status: response.status,
              statusText: response.statusText
            };
          }

          let data = payload;
          if (this.method !== 'GET' && !raw) data = null;

          if (this.singleMode) {
            const rows = Array.isArray(data) ? data : (data == null ? [] : [data]);
            if (this.singleMode === 'single' && rows.length !== 1) {
              return {
                data: null,
                error: asError(`Expected 1 row, received ${rows.length}`, 406),
                count: rows.length,
                status: 406,
                statusText: 'Not Acceptable'
              };
            }
            if (this.singleMode === 'maybe' && rows.length > 1) {
              return {
                data: null,
                error: asError(`Expected 0 or 1 row, received ${rows.length}`, 406),
                count: rows.length,
                status: 406,
                statusText: 'Not Acceptable'
              };
            }
            data = rows[0] ?? null;
          }

          return {
            data,
            error: null,
            count: null,
            status: response.status,
            statusText: response.statusText
          };
        } catch (error) {
          const message = error?.name === 'AbortError'
            ? 'Supabase request timed out'
            : String(error?.message || error || 'Network request failed');
          return {
            data: null,
            error: asError(message),
            count: null,
            status: 0,
            statusText: ''
          };
        } finally {
          clearTimeout(timer);
        }
      })();

      return this._promise;
    }
  }

  function createChannel() {
    const channel = {
      on() { return channel; },
      subscribe(callback) {
        setTimeout(() => {
          try { callback?.('SUBSCRIBED'); } catch (_) {}
        }, 0);
        return channel;
      },
      unsubscribe() { return Promise.resolve('ok'); }
    };
    return channel;
  }

  function createStorageStub() {
    return {
      from() {
        const unsupported = async () => ({
          data: null,
          error: asError('Storage requires the full Supabase client')
        });
        return {
          upload: unsupported,
          update: unsupported,
          download: unsupported,
          remove: unsupported,
          list: unsupported,
          move: unsupported,
          copy: unsupported,
          createSignedUrl: unsupported,
          createSignedUrls: unsupported,
          getPublicUrl(path) {
            return { data: { publicUrl: String(path || '') } };
          }
        };
      }
    };
  }

  function createClient(url = FALLBACK_URL, key = FALLBACK_KEY) {
    const baseUrl = String(url || FALLBACK_URL).replace(/\/$/, '');
    const apiKey = String(key || FALLBACK_KEY);

    const client = {
      from(table) {
        return new RestbrQuery(baseUrl, apiKey, String(table));
      },

      async rpc(name, args = {}) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);
        try {
          const response = await fetch(`${baseUrl}/rest/v1/rpc/${encodeURIComponent(String(name))}`, {
            method: 'POST',
            cache: 'no-store',
            signal: controller.signal,
            headers: {
              apikey: apiKey,
              Authorization: `Bearer ${apiKey}`,
              Accept: 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(args || {})
          });
          const raw = await response.text();
          let data = null;
          if (raw) {
            try { data = JSON.parse(raw); }
            catch (_) { data = raw; }
          }
          if (!response.ok) {
            return {
              data: null,
              error: asError(data?.message || raw || `HTTP ${response.status}`, response.status)
            };
          }
          return { data, error: null };
        } catch (error) {
          return {
            data: null,
            error: asError(error?.name === 'AbortError' ? 'Supabase RPC timed out' : error?.message || error)
          };
        } finally {
          clearTimeout(timer);
        }
      },

      channel() {
        return createChannel();
      },

      removeChannel() {
        return Promise.resolve('ok');
      },

      storage: createStorageStub(),

      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null })
      }
    };

    return client;
  }

  window.supabase = { createClient };
  window.__RESTBR_SUPABASE_TRANSPORT__ = 'rest-fallback';
  console.warn('RESTBR: Supabase CDN unavailable; using local REST fallback client.');
})();
