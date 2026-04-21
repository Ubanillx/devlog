import test from 'node:test';
import assert from 'node:assert/strict';

import { renderEditorMarkdownPreview, renderPostMarkdown } from './markdown';

test('editor preview escapes inline styles from pasted raw html', () => {
  const source = '<span style="color:red">Styled</span>';

  const html = renderEditorMarkdownPreview(source);

  assert.equal(html.includes('style="color:red"'), false);
  assert.match(html, /&lt;span style=.*color:red.*&gt;Styled&lt;\/span&gt;/);
});

test('post rendering keeps trusted raw html support', () => {
  const source = '<span style="color:red">Styled</span>';

  const html = renderPostMarkdown(source);

  assert.match(html, /<span style="color:red">Styled<\/span>/);
});
