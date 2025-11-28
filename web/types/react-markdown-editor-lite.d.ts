declare module 'react-markdown-editor-lite' {
  import { Component } from 'react';

  export interface MdEditorProps {
    value?: string;
    style?: React.CSSProperties;
    renderHTML: (text: string) => string;
    onChange?: (data: { text: string; html: string }) => void;
    placeholder?: string;
    config?: {
      view?: { menu?: boolean; md?: boolean; html?: boolean };
      canView?: { menu?: boolean; md?: boolean; html?: boolean; fullScreen?: boolean; hideMenu?: boolean };
      markdownClass?: string;
      htmlClass?: string;
      syncScrollMode?: string[];
      imageUrl?: string;
      imageAccept?: string;
      linkUrl?: string;
      table?: { maxRow?: number; maxCol?: number };
      logger?: { interval?: number };
      loggerMaxSize?: number;
      allowPasteImage?: boolean;
      onImageUpload?: (file: File) => Promise<string>;
      onCustomImageUpload?: (event: React.SyntheticEvent<HTMLInputElement>) => Promise<{ url: string; text?: string }>;
    };
    plugins?: string[];
  }

  export default class MdEditor extends Component<MdEditorProps> {}
}

declare module 'markdown-it' {
  interface MarkdownItOptions {
    html?: boolean;
    xhtmlOut?: boolean;
    breaks?: boolean;
    langPrefix?: string;
    linkify?: boolean;
    typographer?: boolean;
    quotes?: string;
    highlight?: (str: string, lang: string) => string;
  }

  class MarkdownIt {
    constructor(options?: MarkdownItOptions);
    render(md: string): string;
    renderInline(md: string): string;
  }

  export default MarkdownIt;
}
