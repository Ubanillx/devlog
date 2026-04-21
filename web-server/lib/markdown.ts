import MarkdownIt from 'markdown-it';

const baseOptions = {
  linkify: true,
  typographer: true,
};

const editorPreviewParser = new MarkdownIt({
  ...baseOptions,
  html: false,
});

const postParser = new MarkdownIt({
  ...baseOptions,
  html: true,
});

export function renderEditorMarkdownPreview(text: string) {
  return editorPreviewParser.render(text);
}

export function renderPostMarkdown(text: string) {
  return postParser.render(text);
}
