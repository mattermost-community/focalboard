// Unordered List item delimiter
import findRangesWithRegex from '../utils/findRangesWithRegex';

const createULDelimiterStyleStrategy = () => {
  const ulDelimiterRegex = /^\* /g;

  return {
    style: 'UL-DELIMITER',
    findStyleRanges: block => {
      const text = block.getText();
      const ulDelimiterRanges = findRangesWithRegex(text, ulDelimiterRegex);
      return ulDelimiterRanges;
    },
    styles: {
      fontWeight: 'bold',
      transform: 'translateX(calc(-100% - 12px))'
    }
  };
};

export default createULDelimiterStyleStrategy;
