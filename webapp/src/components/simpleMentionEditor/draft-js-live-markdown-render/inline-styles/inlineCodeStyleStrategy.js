import findRangesWithRegex from '../utils/findRangesWithRegex';

const createInlineCodeStyleStrategy = () => {
  const codeRegex = /(`)([^\n\r`]+?)(`)/g;

  return {
    style: 'INLINE-CODE',
    findStyleRanges: block => {
      // Don't allow inline code inside of code blocks
      if (block.getType() === 'code-block') return [];

      const text = block.getText();
      const codeRanges = findRangesWithRegex(text, codeRegex);
      return codeRanges;
    },
    styles: {
      fontFamily: '"PT Mono", monospace',
      border: '1px solid #ddd',
      borderRadius: '3px',
      padding: '2px'
    }
  };
};

export default createInlineCodeStyleStrategy;
