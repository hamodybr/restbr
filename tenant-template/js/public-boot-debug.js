(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (window.__RESTBR_PUBLIC_BOOT_DEBUG_V2__) return;
  window.__RESTBR_PUBLIC_BOOT_DEBUG_V2__ = true;

  const previousError = console.error.bind(console);

  function compactError(detail) {
    try {
      const message = String(detail?.message || detail || 'Unknown error').trim();
      const stack = String(detail?.stack || '').split('\n').map(v => v.trim()).filter(Boolean);
      const firstFrame = stack.find(line => /^at\s/.test(line)) || '';
      return firstFrame ? `${message} | ${firstFrame}` : message;
    } catch (_) {
      return 'Unknown public menu error';
    }
  }

  console.error = (...args) => {
    let label = '';
    try {
      label = String(args[0] || '');
      const detail = args[1];
      const diagnostic = compactError(detail);

      if (label.includes('Supabase menu loading failed')) {
        window.__RESTBR_PRIMARY_BOOT_ERROR = diagnostic;
        window.__RESTBR_BOOT_ERROR = diagnostic;
      } else if (
        label.includes('SHORASH MENU ERROR') &&
        !window.__RESTBR_PRIMARY_BOOT_ERROR
      ) {
        window.__RESTBR_BOOT_ERROR = diagnostic;
      }
    } catch (_) {}

    previousError(...args);

    if (
      label.includes('SHORASH MENU ERROR') &&
      window.__RESTBR_PRIMARY_BOOT_ERROR
    ) {
      window.__RESTBR_BOOT_ERROR = window.__RESTBR_PRIMARY_BOOT_ERROR;
    }
  };
})();
