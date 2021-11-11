import createLiveMarkdownPlugin from './liveMarkdownPlugin';

// Inline style handlers
import createBoldStyleStrategy from './inline-styles/boldStyleStrategy';
import createItalicStyleStrategy from './inline-styles/italicStyleStrategy';
import createStrikethroughStyleStrategy from './inline-styles/strikethroughStyleStrategy';
import createHeadingDelimiterStyleStrategy from './inline-styles/headingDelimiterStyleStrategy';
import createULDelimiterStyleStrategy from './inline-styles/ulDelimiterStyleStrategy';
import createOLDelimiterStyleStrategy from './inline-styles/olDelimiterStyleStrategy';
import createQuoteStyleStrategy from './inline-styles/quoteStyleStrategy';
import createInlineCodeStyleStrategy from './inline-styles/inlineCodeStyleStrategy';

// Block type handlers
import createCodeBlockStrategy from './block-types/codeBlockStrategy';
import createHeadingBlockStrategy from './block-types/headingBlockStrategy';

export default createLiveMarkdownPlugin;

export {
  createBoldStyleStrategy,
  createItalicStyleStrategy,
  createStrikethroughStyleStrategy,
  createHeadingDelimiterStyleStrategy,
  createULDelimiterStyleStrategy,
  createOLDelimiterStyleStrategy,
  createQuoteStyleStrategy,
  createInlineCodeStyleStrategy,
  createCodeBlockStrategy,
  createHeadingBlockStrategy
};
