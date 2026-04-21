import test from 'node:test';
import assert from 'node:assert/strict';

import { getPreferredClipboardText, insertTextAtSelection } from './editorPaste';

test('prefers plain text over html clipboard content', () => {
  const plainText = '# Title\n\n- item';
  const htmlText = '<meta charset="utf-8"><html><body><h1>Title</h1><ul><li>item</li></ul></body></html>';

  const result = getPreferredClipboardText(plainText, htmlText);

  assert.equal(result, plainText);
});

test('falls back to stripped html text when plain text is unavailable', () => {
  const result = getPreferredClipboardText('', '<p>Hello <strong>world</strong></p><p>Next line</p>');

  assert.equal(result, 'Hello world\nNext line');
});

test('inserts text at the current selection without appending extra content', () => {
  const result = insertTextAtSelection('abcxyz', '123', 3, 3);

  assert.equal(result, 'abc123xyz');
});
