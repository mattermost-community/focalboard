import findRangesWithRegex from '../utils/findRangesWithRegex';

const createHeadingDelimiterStyleStrategy = () => {
  const headingDelimiterRegex = /(^#{1,6})\s/g;

  return {
    style: 'HEADING-DELIMITER',
    findStyleRanges: block => {
      // Skip the text search if the block isn't a header block
      if (block.getType().indexOf('header') < 0) return [];

      const text = block.getText();
      const headingDelimiterRanges = findRangesWithRegex(
        text,
        headingDelimiterRegex
      );
      return headingDelimiterRanges;
    },
    styles: {
      transform: 'translateX(-100%)'
    }
  };
};

export default createHeadingDelimiterStyleStrategy;
