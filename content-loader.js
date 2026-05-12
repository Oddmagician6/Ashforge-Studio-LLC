/* Ashforge content loader
 * Fetches content.json and applies it to the page.
 * Usage in HTML:
 *   <span data-content="siteInfo.heroTitle1"></span>       -> sets textContent
 *   <img data-content-src="supplements.0.imagePath" />     -> sets src
 *   <a data-content-href="siteInfo.patreonUrl"></a>        -> sets href
 *   <meta data-content-attr="content:siteInfo.tagline" />  -> sets named attr
 * Other scripts can listen for the "ashforge:content" event:
 *   window.addEventListener('ashforge:content', e => { e.detail ... })
 * After fetch, window.ASHFORGE_CONTENT is the resolved data object.
 */
(function () {
  function get(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  function applyAll(data) {
    document.querySelectorAll('[data-content]').forEach(el => {
      const v = get(data, el.getAttribute('data-content'));
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll('[data-content-html]').forEach(el => {
      const v = get(data, el.getAttribute('data-content-html'));
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll('[data-content-src]').forEach(el => {
      const v = get(data, el.getAttribute('data-content-src'));
      if (v) el.setAttribute('src', v);
    });
    document.querySelectorAll('[data-content-href]').forEach(el => {
      const v = get(data, el.getAttribute('data-content-href'));
      if (v) el.setAttribute('href', v);
    });
    document.querySelectorAll('[data-content-attr]').forEach(el => {
      const spec = el.getAttribute('data-content-attr');
      const [attr, path] = spec.split(':');
      const v = get(data, path);
      if (v != null) el.setAttribute(attr, v);
    });
  }

  function broadcast(data) {
    window.ASHFORGE_CONTENT = data;
    window.dispatchEvent(new CustomEvent('ashforge:content', { detail: data }));
  }

  // Try fetch first; on failure (file://, missing file) fall back to embedded LS data.
  fetch('content.json', { cache: 'no-cache' })
    .then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
    .then(data => { applyAll(data); broadcast(data); })
    .catch(err => {
      console.warn('[ashforge] content.json fetch failed:', err.message,
        '— page will render with whatever is in the HTML as fallback.');
      // Still broadcast an empty object so listeners can proceed with defaults.
      broadcast(window.ASHFORGE_CONTENT || {});
    });
})();
