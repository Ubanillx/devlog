export function getPreferredClipboardText(plainText: string, htmlText: string) {
  if (plainText) {
    return plainText;
  }

  if (!htmlText) {
    return '';
  }

  return htmlText
    .replace(/<meta[\s\S]*?>/gi, '')
    .replace(/<\/(p|div|li|h[1-6]|tr|blockquote|pre)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function insertTextAtSelection(
  value: string,
  insertedText: string,
  selectionStart: number,
  selectionEnd: number,
) {
  return `${value.slice(0, selectionStart)}${insertedText}${value.slice(selectionEnd)}`;
}
