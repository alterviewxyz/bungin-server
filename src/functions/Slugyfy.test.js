const slugify = require('./Slugify');

test('slug a sample podcast name', () => {
  expect(slugify('channel b')).toBe('channel-b');
});
