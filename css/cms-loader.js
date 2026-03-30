// === CMS Content Loader ===
// Reads JSON content files written by Decap CMS and injects into the page
// Elements with data-cms="fieldName" get their textContent replaced
// Elements with data-cms-html="fieldName" get their innerHTML replaced

(function() {
  const page = document.body.getAttribute('data-page');
  if (!page) return;

  const jsonPath = '/content/' + page + '.json';

  fetch(jsonPath)
    .then(function(res) {
      if (!res.ok) return null;
      return res.json();
    })
    .then(function(data) {
      if (!data) return;

      // Text content
      var els = document.querySelectorAll('[data-cms]');
      for (var i = 0; i < els.length; i++) {
        var field = els[i].getAttribute('data-cms');
        if (data[field]) {
          els[i].textContent = data[field];
        }
      }

      // HTML content (for bold, links, etc.)
      var htmlEls = document.querySelectorAll('[data-cms-html]');
      for (var j = 0; j < htmlEls.length; j++) {
        var htmlField = htmlEls[j].getAttribute('data-cms-html');
        if (data[htmlField]) {
          htmlEls[j].innerHTML = data[htmlField];
        }
      }
    })
    .catch(function() {
      // Silent fail — hardcoded content stays visible
    });
})();
