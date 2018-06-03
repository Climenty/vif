// ==UserScript==
// @name         Vendor items filter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Add ability to filter content.
// @author       Klimentiy Yudintsev
// @match        http://rubenalamina.mx/the-division-weekly-vendor-reset/
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  function hookEvent(element, eventName, callback) {
    if (element.addEventListener) element.addEventListener(eventName, callback, false);
    else if (element.attachEvent) element.attachEvent("on" + eventName, callback);
  }

  function testClass(obj, name) {
    const expr = new RegExp('\\b' + name + '\\b');
    return expr.test(obj.className);
  }

  function addClass(obj, name) {
    if (!testClass(obj, name)) {
      if (obj.className.length > 0) obj.className += ' ';
      obj.className += name;
    }
  }

  function delClass(obj, name) {
    const expr = new RegExp('\\s?\\b' + name + '\\b');
    name = obj.className.replace(expr, '');
    if (name.length == obj.className.length) return false;
    obj.className = name;
    return true;
  }

  function selectOnChange(event) {
    let p = event.target.parentNode.parentNode.parentNode;
    let mod = event.target.value;
    let col = p.querySelectorAll('.columns');
    col.forEach(el => {
      if (mod == 'mod0' || testClass(el, mod)) delClass(el, 'hide');
      else addClass(el, 'hide');
    });
  }

  var TimerId;
  function inputOnKeyup(event) {
    if (TimerId) clearTimeout(TimerId);
    TimerId = setTimeout(event => { TimerId = null; inputOnChange(event) }, 800, event);
  }

  function inputOnChange(event) {
    let p = event.target.parentNode.parentNode.parentNode;
    let filter = event.target.value.toLowerCase();
    let col = p.querySelectorAll('.columns');
    col.forEach(el => {
      let title = el.querySelector('th[class^=header-]').innerText.toLowerCase()
      if (title.includes(filter)) delClass(el, 'hide');
      else addClass(el, 'hide');
    });
  }

  function inputReset(event) {
    let filter = event.target.parentNode.querySelector('.tfilter');
    filter.value = '';
    inputOnChange({ target: filter });
  }

  function addFilter(obj) {
    const wmods = { mod1: ['scope', 'sight'], mod2: ['suppressor', 'compensator', 'brake', 'hider'], mod3: ['magazine'], mod4: ['grip', 'handstop', 'laser'] };
    const gmods = { mod1: ['firearms'], mod2: ['stamina'], mod3: ['electronics'], mod4: ['performance'] };
    let div = document.querySelector(obj.id);
    div.className = 'show dz lz';
    let ch = document.createElement('div');
    ch.className = 'filter';
    ch.innerHTML = '<span>DZ<input type="checkbox" data-area="dz" checked></span><span>LZ<input type="checkbox" data-area="lz" checked></span>';
    if (obj.id.endsWith('gear-mods')) {
      ch.innerHTML += '<span><select><option value="mod0" selected>Any</option><option value="mod1">Firearms</option><option value="mod2">Stamina</option><option value="mod3">Electronics</option><option value="mod4">Performance</option></select></span>';
      hookEvent(ch.querySelector('select'), 'change', selectOnChange);
    }
    if (obj.id.endsWith('weapon-mods')) {
      ch.innerHTML += '<span><select><option value="mod0" selected>Any</option><option value="mod1">Scope</option><option value="mod2">Muzzle</option><option value="mod3">Magazine</option><option value="mod4">Underbarrel</option></select></span>';
      hookEvent(ch.querySelector('select'), 'change', selectOnChange);
    }
    if ((obj.id.match(/-/g) || []).length === 1) {
      ch.innerHTML += '<span>Title filter<input class="tfilter"><input type="button" class="freset" value="reset"></span>';
      hookEvent(ch.querySelector('.tfilter'), 'keyup', inputOnKeyup);
      hookEvent(ch.querySelector('.freset'), 'click', inputReset);
    }

    let col = div.querySelectorAll('.columns');
    div.insertBefore(ch, col[0]);
    ch.querySelectorAll('input[type="checkbox"]').forEach(el => {
      hookEvent(el, 'change', function() {
        let p = this.parentNode.parentNode.parentNode;
        if (this.checked) addClass(p, this.dataset.area);
        else delClass(p, this.dataset.area);
      });
    });
    col.forEach(el => {
      let price = el.querySelector(`tr:nth-child(${obj.i}) td:nth-child(${obj.j})`);
      let area = price.innerText.includes('DZ') ? 'dz' : 'lz';
      addClass(el, area);
      if (obj.id.endsWith('-mods')) {
        let trg = obj.id.includes('gear') ? gmods : wmods;
        let title = el.querySelector('.header-he').innerText.toLowerCase();
        Object.keys(trg).forEach(key => {
          let list = trg[key];
          if (list.some(i => title.includes(i))) addClass(el, key);
        });
      }
    });
  }

  const trg = [
    { id: '#division-gears', i: 4, j: 3 },
    { id: '#division-gear-mods', i: 3, j: 2 },
    { id: '#division-weapons', i: 4, j: 1 },
    { id: '#division-weapon-mods', i: 3, j: 2 }
  ];
  const style = document.createElement('style');
  style.type = 'text/css';
  const cssText =
`.filter {
  margin-bottom: 15px;
  font-weight: bold;
}
.filter span {
  margin-right: 1em;
}
.filter input {
  margin-left: 0.5em;
}
.filter input[type="button"] {
  float: inherit;
  padding: 3px 10px;
  background: #4CAF50;
}
.filter select {
  display: inline;
  color: #666;
}
.show .dz.hide, .show .lz.hide, .show .columns {
  display: none;
}
.dz .dz, .lz .lz {
  display: inline;
}`;
  style.appendChild(document.createTextNode(cssText));
  document.head.appendChild(style);
  trg.forEach(t => addFilter(t));
})();
