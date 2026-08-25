(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  if (window.__RESTBR_PUBLIC_BOOT_DEBUG_V1__) return;
  window.__RESTBR_PUBLIC_BOOT_DEBUG_V1__ = true;

  const previousError = console.error.bind(console);

  console.error = (...args) => {
    let label = '';
    try {
      label = String(args[0] || '');
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

    // tenant-public-isolation runs underneath this wrapper and can replace the
    // useful first failure with the intentionally blocked static fallback.
    // Restore the primary Supabase/REST error so the user sees the real cause.
    if (
      label.includes('SHORASH MENU ERROR') &&
      window.__RESTBR_PRIMARY_BOOT_ERROR
    ) {
      window.__RESTBR_BOOT_ERROR = window.__RESTBR_PRIMARY_BOOT_ERROR;
    }
  };
})();
