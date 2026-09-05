/* Posts any form marked data-ghl to /api/contact as JSON.
   Progressive: without JS the form still has a real action attribute. */
(function () {
  function setStatus(form, text, ok) {
    var el = form.querySelector('.form-status');
    if (!el) {
      el = document.createElement('p');
      el.className = 'form-status';
      form.appendChild(el);
    }
    el.textContent = text;
    el.dataset.state = ok === true ? 'ok' : ok === false ? 'err' : 'busy';
  }

  document.querySelectorAll('form[data-ghl]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('[type=submit]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      setStatus(form, 'Sending…');

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });

      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (j) {
          if (j && j.ok) {
            form.reset();
            setStatus(form, 'Got it. Kelli will get back to you personally.', true);
            if (btn) btn.textContent = 'Sent';
          } else {
            setStatus(form, 'That did not go through. Call or text 281-650-7592 and I will sort it out.', false);
            if (btn) { btn.disabled = false; btn.textContent = label; }
          }
        })
        .catch(function () {
          setStatus(form, 'That did not go through. Call or text 281-650-7592 and I will sort it out.', false);
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  });
})();
