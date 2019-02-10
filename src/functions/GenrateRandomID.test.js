const genRanId = require('./GenrateRandomID');

test('slug a sample podcast name', () => {
  expect(genRanId(9)).toHaveLength(9);
});
