// ==UserScript==
// @name         Wattpad Auto Scroll + Load More (with controls)
// @namespace    https://khaid-anthony.local/userscripts
// @version      1.1.0
// @description  Auto-scrolls and/or clicks "Load more" on Wattpad search pages with a Start/Stop control panel
// @license      MIT
// @match        https://www.wattpad.com/search*
// @match        https://wattpad.com/search*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://update.greasyfork.org/scripts/546423/Wattpad%20Auto%20Scroll%20%2B%20Load%20More%20%28with%20controls%29.user.js
// @updateURL    https://update.greasyfork.org/scripts/546423/Wattpad%20Auto%20Scroll%20%2B%20Load%20More%20%28with%20controls%29.meta.js
// ==/UserScript==

(function () {
  'use strict';

  // --- Utilities ------------------------------------------------------------
  const logTag = '[WattpadAuto]';
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function findLoadMore() {
    // Greedy search for any "Load..." control
    const nodes = document.querySelectorAll('button, [role="button"]');
    for (const n of nodes) {
      const txt  = (n.textContent || '').trim();
      const aria = (n.getAttribute('aria-label') || '').trim();
      if (/^\s*load\b/i.test(txt) || /^\s*load\b/i.test(aria)) {
        return n.closest('button') || n;
      }
    }
    return null;
  }

  // Optional: accept cookie banner so clicks aren’t blocked
  (function maybeAcceptConsent() {
    const btn = document.querySelector('#onetrust-accept-btn-handler');
    if (btn) btn.click();
  })();

  // --- State ----------------------------------------------------------------
  const STATE = {
    running: false,
    doScroll: true,
    doClick: true,
    intervalMs: 1200,
    maxStagnantTicks: 6,
    _timer: null,
    _lastHeight: 0,
    _stagnant: 0,
  };

  // --- Control Panel --------------------------------------------------------
  function makePanel() {
    const panel = document.createElement('div');
    panel.id = 'wattpad-auto-panel';
    panel.innerHTML = `
      <div style="font-weight:600;margin-bottom:6px;">Wattpad Auto</div>
      <label style="display:flex;align-items:center;gap:.4rem;margin:.25rem 0;">
        <input id="wa-scroll" type="checkbox" checked>
        <span>Auto-scroll</span>
      </label>
      <label style="display:flex;align-items:center;gap:.4rem;margin:.25rem 0;">
        <input id="wa-click" type="checkbox" checked>
        <span>Click “Load more”</span>
      </label>
      <div style="display:flex;gap:.5rem;margin-top:.4rem;">
        <button id="wa-start" style="padding:.35rem .6rem;border:1px solid #1a1a1a;border-radius:6px;cursor:pointer;">Start</button>
        <button id="wa-stop"  style="padding:.35rem .6rem;border:1px solid #1a1a1a;border-radius:6px;cursor:pointer;">Stop</button>
      </div>
      <div id="wa-status" style="margin-top:.4rem;font-size:.85rem;opacity:.85;">Status: idle</div>
      <div style="margin-top:.35rem;font-size:.8rem;opacity:.7;">Hotkey: Alt+Shift+S</div>
    `;
    Object.assign(panel.style, {
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      zIndex: 999999,
      background: 'rgba(255,255,255,.95)',
      color: '#111',
      border: '1px solid #ccc',
      borderRadius: '10px',
      padding: '10px 12px',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial',
      boxShadow: '0 6px 18px rgba(0,0,0,.12)',
      width: '200px'
    });
    document.documentElement.appendChild(panel);

    // Wire up controls
    panel.querySelector('#wa-scroll').addEventListener('change', e => {
      STATE.doScroll = e.target.checked;
    });
    panel.querySelector('#wa-click').addEventListener('change', e => {
      STATE.doClick = e.target.checked;
    });
    panel.querySelector('#wa-start').addEventListener('click', start);
    panel.querySelector('#wa-stop').addEventListener('click', stop);

    // Keyboard toggle
    window.addEventListener('keydown', (e) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyS') {
        STATE.running ? stop() : start();
      }
    });

    return panel;
  }

  const panel = makePanel();
  const statusEl = panel.querySelector('#wa-status');

  function setStatus(txt) {
    statusEl.textContent = `Status: ${txt}`;
  }

  // --- Engine ---------------------------------------------------------------
  async function tick() {
    try {
      if (!STATE.running) return;

      // 1) Scroll
      if (STATE.doScroll) {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
      }

      // 2) Click "Load more"
      if (STATE.doClick) {
        const btn = findLoadMore();
        if (btn && !btn.disabled) {
          btn.click();
          STATE._stagnant = 0;
          setStatus('clicking “Load more”…');
          await sleep(200); // brief yield for DOM to react
        }
      }

      // 3) Stagnation detection (auto-stop when nothing else loads)
      const h = document.body.scrollHeight;
      if (h <= STATE._lastHeight && (!STATE.doClick || !findLoadMore())) {
        STATE._stagnant++;
        if (STATE._stagnant >= STATE.maxStagnantTicks) {
          console.log(logTag, 'No further growth detected; auto-stopping.');
          stop();
          return;
        }
      } else {
        STATE._stagnant = 0;
        STATE._lastHeight = h;
      }

      setStatus(`running · h=${STATE._lastHeight} · stagnant=${STATE._stagnant}/${STATE.maxStagnantTicks}`);
    } catch (err) {
      console.warn(logTag, err);
      setStatus('error (see console)');
    }
  }

  function start() {
    if (STATE.running) return;
    STATE.running = true;
    STATE._stagnant = 0;
    STATE._lastHeight = document.body.scrollHeight;
    setStatus('running…');
    console.log(logTag, 'Started.');
    STATE._timer = setInterval(tick, STATE.intervalMs);
  }

  function stop() {
    if (!STATE.running) return;
    STATE.running = false;
    clearInterval(STATE._timer);
    STATE._timer = null;
    setStatus('stopped');
    console.log(logTag, 'Stopped.');
  }

  // Expose a small console helper (optional)
  window.__WATT_AUTO__ = { start, stop, state: STATE };

  // (Default: idle; user can press Start or Alt+Shift+S)
})();
