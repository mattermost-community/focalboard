// Unordered List item delimiter
import findRangesWithRegex from '../utils/findRangesWithRegex';

const createQuoteStyleStrategy = () => {
  const quoteRegex = /^> (.*)/g;
  const quoteDelimiterRegex = /^> /g;

  return {
    style: 'QUOTE',
    delimiterStyle: 'QUOTE-DELIMITER',
    findStyleRanges: block => {
      const text = block.getText();
      const quoteRanges = findRangesWithRegex(text, quoteRegex);
      return quoteRanges;
    },
    findDelimiterRanges: (block, styleRanges) => {
      const text = block.getText();
      let quoteDelimiterRanges = [];
      styleRanges.forEach(styleRange => {
        const delimiterRange = findRangesWithRegex(
          text.substring(styleRange[0], styleRange[1] + 1),
          quoteDelimiterRegex
        ).map(indices => indices.map(x => x + styleRange[0]));
        quoteDelimiterRanges = quoteDelimiterRanges.concat(delimiterRange);
      });
      return quoteDelimiterRanges;
    },
    styles: {
      opacity: 0.75,
      fontFamily: '"PT Serif", serif',
      fontSize: '1.1em'
    },
    delimiterStyles: {
      transform: 'translateX(calc(-100%))'
    }
  };
};

export default createQuoteStyleStrategy;
