// Returns an array of arrays containing start and end indices for ranges of text
// that match the supplied regex
const findRangesWithRegex = (text, regex) => {
  let ranges = [];
  let matches;

  do {
    matches = regex.exec(text);
    if (matches) {
      ranges.push([matches.index, matches.index + matches[0].length - 1]);
    }
  } while (matches);

  return ranges;
};

export default findRangesWithRegex;
