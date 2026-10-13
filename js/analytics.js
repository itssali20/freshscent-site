/* FreshScent Box — Google Analytics 4
   Paste your GA4 Measurement ID (Google Analytics → Admin → Data streams → Web) below,
   e.g. 'G-AB12CD34EF'. While it's empty, nothing is loaded and no data is collected. */
(() => {
  const GA_MEASUREMENT_ID = '';

  if (!/^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID)) return;
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;

  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID);

  // Conversion events: partner requests and Box searches
  document.addEventListener('submit', e => {
    if (e.target.id === 'partnerForm' && e.target.checkValidity()) gtag('event', 'generate_lead', { form: 'partner_request' });
    if (e.target.id === 'zipForm') gtag('event', 'search', { search_term: (e.target.zip && e.target.zip.value || '').trim() });
  });
})();
