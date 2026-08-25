(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (window.__RESTBR_PUBLIC_BOOT_DEBUG_V1__) return;
  window.__RESTBR_PUBLIC_BOOT_DEBUG_V1__ = true;

  const previousError = console.error.bind(console);

  console.error = (...args) => {
    try {
      const label = String(args[0] || '');
      const detail = args[1];
      const message = String(detail?.message || detail || '').trim();

      if (label.includes('Supabase menu loading failed')) {
        window.__RESTBR_PRIMARY_BOOT_ERROR = message || 'Unknown Supabase menu loading error';
        window.__RESTBR_BOOT_ERROR = window.__RESTBR_PRIMARY_BOOT_ERROR;
      } else if (
        label.includes('SHORASH MENU ERROR') &&
        !window.__RESTBR_PRIMARY_BOOT_ERROR
      ) {
        window.__RESTBR_BOOT_ERROR = message || 'Unknown public menu error';
      }
    } catch (_) {}

    previousError(...args);
  };
})();
