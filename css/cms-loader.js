(function() {
  var page = document.body.getAttribute('data-page');
  if (!page) return;
  fetch('/content/' + page + '.json')
    .then(function(res) { if (!res.ok) return null; return res.json(); })
    .then(function(data) {
      if (!data) return;
      var els = document.querySelectorAll('[data-cms]');
      for (var i = 0; i < els.length; i++) {
        var field = els[i].getAttribute('data-cms');
        if (data[field]) els[i].textContent = data[field];
      }
      var htmlEls = document.querySelectorAll('[data-cms-html]');
      for (var j = 0; j < htmlEls.length; j++) {
        var htmlField = htmlEls[j].getAttribute('data-cms-html');
        var value = data[htmlField];
        if (typeof value !== 'string' || !value) continue;

        // The homepage heading supports plain text and <em> emphasis only.
        var parts = value.split(/<em>([^<>]*)<\/em>/gi);
        var heading = document.createDocumentFragment();
        parts.forEach(function(part, index) {
          if (index % 2 === 0) {
            heading.append(part);
          } else {
            var emphasis = document.createElement('em');
            emphasis.textContent = part;
            heading.append(emphasis);
          }
        });
        htmlEls[j].replaceChildren(heading);
      }
    })
    .catch(function() {});
})();
