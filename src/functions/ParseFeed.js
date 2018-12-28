// migrated to "node-podcast-parser"
const request = require('request');
const parsePodcast = require('node-podcast-parser');

const ParseFeed = feedURL =>
  new Promise((fulfilled, rejected) => {
    request(feedURL, async (err, res, data) => {
      if (err) {
        return rejected(new Error('Network error'));
      }
      await parsePodcast(data, (err, data) => {
        if (err) {
          return rejected(new Error('Parsing error'));
        }
        return fulfilled(data);
      });
    });
  });

module.exports = ParseFeed;
