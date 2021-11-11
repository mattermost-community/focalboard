// Ordered List item delimiter
import findRangesWithRegex from '../utils/findRangesWithRegex';

const createOLDelimiterStyleStrategy = () => {
  const olDelimiterRegex = /^\d{1,3}\. /g;

  return {
    style: 'OL-DELIMITER',
    findStyleRanges: block => {
      const text = block.getText();
      const olDelimiterRanges = findRangesWithRegex(text, olDelimiterRegex);
      return olDelimiterRanges;
    },
  };
};

export default createOLDelimiterStyleStrategy;
