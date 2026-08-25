(() => {
  if (/(?:^|\/)admin\.html$/i.test(location.pathname)) return;
  window.__RESTBR_FORCE_LOCAL_REST_CLIENT__ = true;
})();
