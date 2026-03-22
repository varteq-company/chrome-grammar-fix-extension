import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTargetSelector,
  isEditable,
  isIgnoredInputType,
  shouldAttachTarget,
} from '../../src/content/targeting.js';

function makeElement({
  tagName = 'DIV',
  type = 'text',
  isContentEditable = false,
  role = null,
  ariaLabel = '',
  title = '',
  gEditable = null,
  className = '',
  width = 400,
  height = 180,
  hidden = false,
  parentElement = null,
  composeContext = false,
} = {}) {
  return {
    tagName,
    type,
    isContentEditable,
    className,
    parentElement,
    getAttribute(name) {
      if (name === 'role') return role;
      if (name === 'aria-label') return ariaLabel;
      if (name === 'title') return title;
      if (name === 'g_editable') return gEditable;
      return null;
    },
    getBoundingClientRect() {
      return { width, height, top: 0, left: 0 };
    },
    closest(selector) {
      if (composeContext && selector === '.M9, .aDh, .aO7, [role="dialog"]') {
        return {};
      }
      return null;
    },
    matches() {
      return false;
    },
    _hidden: hidden,
  };
}

function computedStyleStub(el) {
  if (el._hidden) {
    return { display: 'none', visibility: 'hidden' };
  }
  return { display: 'block', visibility: 'visible' };
}

test('isEditable detects textarea, input text, and contenteditable', () => {
  assert.equal(isEditable(makeElement({ tagName: 'TEXTAREA' })), true);
  assert.equal(isEditable(makeElement({ tagName: 'INPUT', type: 'text' })), true);
  assert.equal(isEditable(makeElement({ tagName: 'DIV', isContentEditable: true })), true);
  assert.equal(isEditable(makeElement({ tagName: 'INPUT', type: 'password' })), false);
  assert.equal(isEditable(makeElement({ tagName: 'INPUT', type: 'email' })), false);
  assert.equal(isEditable(makeElement({ tagName: 'INPUT', type: 'number' })), false);
  assert.equal(isEditable(makeElement({ tagName: 'INPUT', type: 'tel' })), false);
});

test('isIgnoredInputType blocks email number and tel', () => {
  assert.equal(isIgnoredInputType(makeElement({ tagName: 'INPUT', type: 'email' })), true);
  assert.equal(isIgnoredInputType(makeElement({ tagName: 'INPUT', type: 'number' })), true);
  assert.equal(isIgnoredInputType(makeElement({ tagName: 'INPUT', type: 'tel' })), true);
  assert.equal(isIgnoredInputType(makeElement({ tagName: 'INPUT', type: 'text' })), false);
});

test('shouldAttachTarget skips nested editables', () => {
  const parentEditable = makeElement({ tagName: 'DIV', isContentEditable: true });
  const childEditable = makeElement({ tagName: 'TEXTAREA', parentElement: parentEditable });
  assert.equal(shouldAttachTarget(childEditable, false, computedStyleStub), false);
});

test('shouldAttachTarget allows normal textarea on non-gmail pages', () => {
  const textarea = makeElement({ tagName: 'TEXTAREA' });
  assert.equal(shouldAttachTarget(textarea, false, computedStyleStub), true);
});

test('shouldAttachTarget rejects ignored input types on non-gmail pages', () => {
  const emailInput = makeElement({ tagName: 'INPUT', type: 'email' });
  const numberInput = makeElement({ tagName: 'INPUT', type: 'number' });
  const telInput = makeElement({ tagName: 'INPUT', type: 'tel' });
  assert.equal(shouldAttachTarget(emailInput, false, computedStyleStub), false);
  assert.equal(shouldAttachTarget(numberInput, false, computedStyleStub), false);
  assert.equal(shouldAttachTarget(telInput, false, computedStyleStub), false);
});

test('shouldAttachTarget allows Gmail compose body', () => {
  const gmailBody = makeElement({
    isContentEditable: true,
    role: 'textbox',
    gEditable: 'true',
    className: 'Am aiL',
    composeContext: true,
    width: 600,
    height: 220,
  });
  assert.equal(shouldAttachTarget(gmailBody, true, computedStyleStub), true);
});

test('shouldAttachTarget rejects Gmail non-compose and tiny/hidden fields', () => {
  const nonCompose = makeElement({
    isContentEditable: true,
    role: 'textbox',
    width: 600,
    height: 220,
  });
  const tinyField = makeElement({
    isContentEditable: true,
    role: 'textbox',
    gEditable: 'true',
    width: 80,
    height: 20,
  });
  const hiddenField = makeElement({
    isContentEditable: true,
    role: 'textbox',
    gEditable: 'true',
    hidden: true,
  });
  assert.equal(shouldAttachTarget(nonCompose, true, computedStyleStub), false);
  assert.equal(shouldAttachTarget(tinyField, true, computedStyleStub), false);
  assert.equal(shouldAttachTarget(hiddenField, true, computedStyleStub), false);
});

test('getTargetSelector switches by host mode', () => {
  assert.equal(getTargetSelector(true), '[contenteditable="true"][role="textbox"]');
  assert.match(getTargetSelector(false), /textarea/);
  assert.doesNotMatch(getTargetSelector(false), /input\[type="email"\]/);
});
