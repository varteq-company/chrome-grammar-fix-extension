import { getTargetSelector, shouldAttachTarget } from './targeting.js';

(() => {
  const PROCESSED = new WeakSet();
  const ICON_HOST_ATTR = 'data-gf-host';
  const isGmail = window.location.hostname === 'mail.google.com';

  const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
  </svg>`;

  const SPINNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>`;

  const SHADOW_STYLES = `
    :host {
      position: absolute;
      z-index: 2147483647;
      pointer-events: none;
    }
    .gf-btn {
      pointer-events: auto;
      position: absolute;
      bottom: 6px;
      right: 6px;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 6px;
      background: #6C63FF;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(108,99,255,.4);
      transition: background .15s, transform .15s, opacity .15s;
      opacity: 0.85;
    }
    .gf-btn:hover {
      background: #5a52d5;
      transform: scale(1.1);
      opacity: 1;
    }
    .gf-btn:active { transform: scale(0.95); }
    .gf-btn svg { width: 16px; height: 16px; }
    .gf-btn.loading svg {
      animation: gf-spin .6s linear infinite;
    }
    .gf-btn.success { background: #22c55e; }
    .gf-btn.error { background: #ef4444; }
    .gf-tooltip {
      pointer-events: none;
      position: absolute;
      bottom: 40px;
      right: 0;
      background: #1e1e2e;
      color: #fff;
      font-size: 12px;
      font-family: system-ui, sans-serif;
      padding: 6px 10px;
      border-radius: 6px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity .2s;
      box-shadow: 0 2px 8px rgba(0,0,0,.3);
    }
    .gf-tooltip.visible { opacity: 1; }
    @keyframes gf-spin {
      to { transform: rotate(360deg); }
    }
  `;

  function getText(el) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value;
    return el.innerText;
  }

  function setText(el, text) {
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
        'value'
      ).set;
      nativeSetter.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      el.innerText = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  function positionHost(host, target) {
    const rect = target.getBoundingClientRect();
    host.style.top = `${rect.top + window.scrollY}px`;
    host.style.left = `${rect.left + window.scrollX}px`;
    host.style.width = `${rect.width}px`;
    host.style.height = `${rect.height}px`;
  }

  function showTooltip(tooltip, msg, duration = 2500) {
    tooltip.textContent = msg;
    tooltip.classList.add('visible');
    setTimeout(() => tooltip.classList.remove('visible'), duration);
  }

  // Shared floating overlay — one instance reused across focus targets
  let activeHost = null;
  let activeTarget = null;
  let activeBtn = null;
  let activeTooltip = null;
  let activeResizeObserver = null;
  let hideTimer = null;
  let isLoading = false;
  const scrollOptions = { capture: true, passive: true };

  function createOverlay() {
    const host = document.createElement('div');
    host.setAttribute(ICON_HOST_ATTR, '');
    host.style.display = 'none';
    const shadow = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = SHADOW_STYLES;

    const btn = document.createElement('button');
    btn.className = 'gf-btn';
    btn.innerHTML = ICON_SVG;
    btn.title = 'Fix grammar';

    const tooltip = document.createElement('div');
    tooltip.className = 'gf-tooltip';

    shadow.append(style, tooltip, btn);
    document.body.appendChild(host);

    activeHost = host;
    activeBtn = btn;
    activeTooltip = tooltip;
    activeResizeObserver = new ResizeObserver(() => {
      if (activeTarget) positionHost(activeHost, activeTarget);
    });

    const reposition = () => {
      if (activeTarget) positionHost(activeHost, activeTarget);
    };
    document.addEventListener('scroll', reposition, scrollOptions);
    window.addEventListener('resize', reposition, { passive: true });

    btn.addEventListener('mousedown', (e) => {
      // Prevent blur on the target so the button click registers
      e.preventDefault();
    });

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const target = activeTarget;
      if (!target || isLoading) return;

      const text = getText(target);
      if (!text || !text.trim()) {
        showTooltip(activeTooltip, 'Nothing to fix');
        return;
      }

      isLoading = true;
      btn.classList.remove('success', 'error');
      btn.classList.add('loading');
      btn.innerHTML = SPINNER_SVG;

      try {
        const response = await chrome.runtime.sendMessage({ type: 'fixGrammar', text });

        if (response.error) {
          btn.classList.remove('loading');
          btn.classList.add('error');
          btn.innerHTML = ICON_SVG;
          showTooltip(activeTooltip, response.error);
          setTimeout(() => btn.classList.remove('error'), 3000);
          return;
        }

        setText(target, response.corrected);
        btn.classList.remove('loading');
        btn.classList.add('success');
        btn.innerHTML = ICON_SVG;
        showTooltip(activeTooltip, 'Grammar fixed!');
        setTimeout(() => btn.classList.remove('success'), 2000);
      } catch (err) {
        btn.classList.remove('loading');
        btn.classList.add('error');
        btn.innerHTML = ICON_SVG;
        showTooltip(activeTooltip, err.message || 'Something went wrong');
        setTimeout(() => btn.classList.remove('error'), 3000);
      } finally {
        isLoading = false;
      }
    });
  }

  function showOverlay(target) {
    clearTimeout(hideTimer);
    if (!activeHost) createOverlay();

    if (activeTarget !== target) {
      if (activeTarget) activeResizeObserver.unobserve(activeTarget);
      activeTarget = target;
      activeResizeObserver.observe(target);
    }

    positionHost(activeHost, target);
    activeHost.style.display = '';
    activeBtn.classList.remove('success', 'error', 'loading');
    activeBtn.innerHTML = ICON_SVG;
  }

  function hideOverlay() {
    if (isLoading) return;
    hideTimer = setTimeout(() => {
      if (activeHost) activeHost.style.display = 'none';
      if (activeTarget && activeResizeObserver) {
        activeResizeObserver.unobserve(activeTarget);
      }
      activeTarget = null;
    }, 150);
  }

  function handleFocusIn(e) {
    const target = e.target;
    if (!target || !shouldAttachTarget(target, isGmail, window.getComputedStyle)) return;
    showOverlay(target);
  }

  function handleFocusOut() {
    hideOverlay();
  }

  document.addEventListener('focusin', handleFocusIn, true);
  document.addEventListener('focusout', handleFocusOut, true);
})();
