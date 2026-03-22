/**
 * Field targeting policy:
 * - Keep a single source of truth for input filtering
 * - Explicitly block field types where grammar fixes are not useful/safe
 */
const BLOCKED_INPUT_TYPES = new Set(['email', 'number', 'tel']);
const ALLOWED_INPUT_TYPES = new Set(['text', 'search', 'url']);

function normalizeInputType(type) {
  return String(type || 'text').toLowerCase();
}

export function isIgnoredInputType(el) {
  if (!el || el.tagName !== 'INPUT') return false;
  return BLOCKED_INPUT_TYPES.has(normalizeInputType(el.type));
}

export function isEditable(el) {
  if (!el) return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.tagName === 'INPUT') {
    if (isIgnoredInputType(el)) return false;
    return ALLOWED_INPUT_TYPES.has(normalizeInputType(el.type));
  }
  if (el.isContentEditable) return true;
  return false;
}

export function hasEditableAncestor(el) {
  let parent = el?.parentElement;
  while (parent) {
    if (isEditable(parent)) return true;
    parent = parent.parentElement;
  }
  return false;
}

export function isGmailComposeBody(el, getComputedStyleFn = window.getComputedStyle) {
  if (!el?.isContentEditable) return false;
  if (el.getAttribute('role') !== 'textbox') return false;

  const style = getComputedStyleFn(el);
  if (style.display === 'none' || style.visibility === 'hidden') return false;

  const rect = el.getBoundingClientRect();
  if (rect.width < 140 || rect.height < 40) return false;

  const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
  const title = (el.getAttribute('title') || '').toLowerCase();
  const className = typeof el.className === 'string' ? el.className : '';
  const inComposeContext = !!el.closest('.M9, .aDh, .aO7, [role="dialog"]');
  const hasBodyHints =
    ariaLabel.includes('message body') ||
    title.includes('message body') ||
    el.getAttribute('g_editable') === 'true' ||
    /\bAm\b/.test(className);

  return hasBodyHints || inComposeContext;
}

export function shouldAttachTarget(el, isGmail, getComputedStyleFn = window.getComputedStyle) {
  if (!isEditable(el)) return false;
  if (isIgnoredInputType(el)) return false;
  if (hasEditableAncestor(el)) return false;

  if (isGmail) {
    return isGmailComposeBody(el, getComputedStyleFn);
  }

  return true;
}

export function getTargetSelector(isGmail) {
  return isGmail
    ? '[contenteditable="true"][role="textbox"]'
    : 'textarea, [contenteditable="true"], [contenteditable=""], input[type="text"], input[type="search"], input[type="url"]';
}
