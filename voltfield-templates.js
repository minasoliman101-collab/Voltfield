/* Document templates: fill, remember, total, print, export.
   Nothing here talks to a server. Values are kept in localStorage under
   vf_tpl_<key> so a reload does not lose a half-filled form. */
(function () {
  var doc = document.getElementById('tplDoc');
  if (!doc) return;
  var KEY = 'vf_tpl_' + doc.dataset.key;
  var status = document.getElementById('tplStatus');
  var tables = [].slice.call(doc.querySelectorAll('table.tt'));
  var say = function (t) { if (status) status.textContent = t; };

  function num(v) { var n = parseFloat(String(v == null ? '' : v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; }
  function money(n) { return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function grow(el) { if (el.tagName === 'TEXTAREA') { el.style.height = 'auto'; el.style.height = (el.scrollHeight + 2) + 'px'; } }

  /* ---- table rows ---- */
  tables.forEach(function (t) {
    var body = t.tBodies[0];
    t._proto = body.rows[0].cloneNode(true);
    var want = parseInt(t.dataset.rows, 10) || 4;
    while (body.rows.length < want) body.appendChild(t._proto.cloneNode(true));
    t._pre = JSON.parse(t.dataset.pre || '[]');
  });
  function setRows(t, n) {
    var body = t.tBodies[0];
    while (body.rows.length < n) body.appendChild(t._proto.cloneNode(true));
    while (body.rows.length > n && body.rows.length > 1) body.deleteRow(body.rows.length - 1);
  }
  function rowData(t) {
    return [].map.call(t.tBodies[0].rows, function (r) {
      return [].map.call(r.querySelectorAll('[data-col]'), function (c) { return c.value; });
    });
  }
  function fillRows(t, rows) {
    setRows(t, Math.max(rows.length, parseInt(t.dataset.rows, 10) || 4));
    [].forEach.call(t.tBodies[0].rows, function (r, i) {
      [].forEach.call(r.querySelectorAll('[data-col]'), function (c, j) {
        c.value = (rows[i] && rows[i][j] != null) ? rows[i][j] : '';
      });
    });
  }

  /* ---- totals ---- */
  function recalc() {
    tables.forEach(function (t) {
      var sums = {};
      [].forEach.call(t.tBodies[0].rows, function (r) {
        var get = function (k) { return r.querySelector('[data-col="' + k + '"]'); };
        if (t.dataset.prod) {
          var pk = t.dataset.prod.split(','), pw = get(pk[0]), ps = get(pk[1]), po = get(pk[2]);
          if (po) po.value = (pw.value.trim() !== '' && ps.value.trim() !== '') ? (num(pw.value) * num(ps.value) / 100).toFixed(2) : '';
        }
        if (t.dataset.money) {
          var q = get('qty'), p = get('price'), a = get('amount');
          if (a) {
            var has = q.value.trim() !== '' && p.value.trim() !== '';
            a.value = has ? money(num(q.value) * num(p.value)) : '';
            sums.amount = (sums.amount || 0) + (has ? num(q.value) * num(p.value) : 0);
          }
        }
        [].forEach.call(t.querySelectorAll('[data-sum]'), function (o) {
          var c = get(o.dataset.sum); sums[o.dataset.sum] = (sums[o.dataset.sum] || 0) + (c ? num(c.value) : 0);
        });
      });
      [].forEach.call(t.querySelectorAll('[data-sum]'), function (o) { o.textContent = (sums[o.dataset.sum] || 0).toLocaleString('en-US'); });
      if (t.dataset.money) {
        var sub = doc.querySelector('[data-total="subtotal"]'), tot = doc.querySelector('[data-total="total"]');
        var tax = doc.querySelector('[data-total="tax"]'), fr = doc.querySelector('[data-total="freight"]');
        var any = (sums.amount || 0) !== 0;
        if (sub) sub.value = any ? money(sums.amount) : '';
        if (tot) tot.value = any ? money(sums.amount + num(tax && tax.value) + num(fr && fr.value)) : '';
      }
    });
  }

  /* ---- persistence ---- */
  function snapshot() {
    var f = {};
    [].forEach.call(doc.querySelectorAll('[name]'), function (el) {
      if (el.readOnly) return;
      f[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    });
    var tb = {}; tables.forEach(function (t) { tb[t.dataset.table] = rowData(t); });
    return { f: f, t: tb };
  }
  function restore(s) {
    [].forEach.call(doc.querySelectorAll('[name]'), function (el) {
      if (el.readOnly || !(el.name in s.f)) return;
      if (el.type === 'checkbox') el.checked = !!s.f[el.name]; else el.value = s.f[el.name];
    });
    tables.forEach(function (t) { if (s.t && s.t[t.dataset.table]) fillRows(t, s.t[t.dataset.table]); });
  }
  function refresh() { recalc(); [].forEach.call(doc.querySelectorAll('textarea'), grow); }
  var timer;
  function save() {
    clearTimeout(timer);
    timer = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(snapshot())); } catch (e) {} }, 300);
  }
  tables.forEach(function (t) { if (t._pre.length) fillRows(t, t._pre); });
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved && saved.f) restore(saved); } catch (e) {}
  refresh();

  doc.addEventListener('input', function (e) { grow(e.target); recalc(); save(); });
  doc.addEventListener('change', function () { recalc(); save(); });
  /* tidy money fields when the user leaves them */
  doc.addEventListener('focusout', function (e) {
    var el = e.target;
    if ((el.dataset.col === 'price' || /^p[123]$/.test(el.dataset.col || '') || el.dataset.total) && !el.readOnly && el.value.trim() !== '' && isFinite(parseFloat(el.value.replace(/,/g, '')))) {
      el.value = money(num(el.value)); recalc(); save();
    }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add],[data-del],[data-act]');
    if (!b) return;
    if (b.hasAttribute('data-add') || b.hasAttribute('data-del')) {
      var wrap = b.closest('.tt-add').previousElementSibling, t = wrap && wrap.querySelector('table.tt');
      if (!t) return;
      setRows(t, t.tBodies[0].rows.length + (b.hasAttribute('data-add') ? 1 : -1));
      if (b.hasAttribute('data-add')) { var last = t.tBodies[0].rows[t.tBodies[0].rows.length - 1].querySelector('[data-col]'); if (last) last.focus(); }
      refresh(); save(); return;
    }
    var act = b.dataset.act;
    if (act === 'print') { refresh(); window.print(); }
    if (act === 'example') {
      [].forEach.call(doc.querySelectorAll('[name]'), function (el) {
        if (el.readOnly) return;
        if (el.type === 'checkbox') el.checked = false; else el.value = el.dataset.ex || '';
      });
      tables.forEach(function (t) { fillRows(t, JSON.parse(t.dataset.ex || '[]')); });
      [].forEach.call(doc.querySelectorAll('[data-col=price],[data-col=p1],[data-col=p2],[data-col=p3]'), function (el) { if (el.value.trim() !== '') el.value = money(num(el.value)); });
      refresh(); save();
      say('Example values loaded. Names, numbers and prices are placeholders, not real companies or market prices.');
    }
    if (act === 'clear') {
      if (!window.confirm('Clear everything typed into this template?')) return;
      [].forEach.call(doc.querySelectorAll('[name]'), function (el) { if (el.type === 'checkbox') el.checked = false; else el.value = ''; });
      tables.forEach(function (t) { fillRows(t, t._pre); });
      refresh();
      try { localStorage.removeItem(KEY); } catch (e2) {}
      say('Cleared.');
    }
    if (act === 'csv') {
      var q = function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; };
      var lines = [];
      tables.forEach(function (t) {
        lines.push([].map.call(t.tHead.rows[0].cells, function (c) { return q(c.textContent); }).join(','));
        rowData(t).forEach(function (r) { if (r.some(function (v) { return v.trim() !== ''; })) lines.push(r.map(q).join(',')); });
      });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' }));
      a.download = 'voltfield-' + doc.dataset.name + '-lines.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      say('Line items downloaded as CSV.');
    }
  });
  window.addEventListener('beforeprint', refresh);
})();
