var FeedParser = require('feedparser');
var request = require('request');
var textVersion = require("textversionjs");

var feedparser = new FeedParser([]);

const ParseFeed = (feedURL) => {
    return new Promise(function (fulfilled, rejected) {
        var req = request((feedURL));

        req.on('error', function (error) {
            // handle any request errors
            throw new Error("Got Error In Parsing Feed URL.");
        });
        
        req.on('response', function (res) {
            var stream = this; // `this` is `req`, which is a stream
            
            if (res.statusCode !== 200) {
                this.emit('error', new Error('Bad status code'));
            }
            else {
                stream.pipe(feedparser);
            }
        });
        
        feedparser.on('error', function (error) {
            // always handle errors
        });
        
        feedparser.on('readable', function () {
            // This is where the action is!
            var stream = this; // `this` is `feedparser`, which is a stream
            var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
            var item;

            const parsedMeta = {
                "rss": feedURL,
                "pending": true,
                "title": meta.title,
                "description": meta.description,
                "language": meta.language,
                "image": meta.image,
                "category":meta["itunes:category"] || meta.categories,
                "copyright":meta.copyright,
                "website": meta.link,
                "author": meta.author
            }
        
            let Items = [];

            stream.on('data', (chunk) => {
                Items.push(chunk);
            });
            stream.on('end', () => {
                const parsedItems = Items.map(episode => {
                    return {
                        "author": episode.author,
                        "content": textVersion(episode.description || episode.summary),
                        "date":episode.date,
                        "permalink": episode.permalink,
                        "duration":episode['itunes:duration'],
                        "image":episode['itunes:image'],
                        "episode": episode['itunes:episode'],
                        "season": episode['itunes:season'],
                        "title": episode.title,
                        "episodetype": episode['itunes:episodetype'],
                    }
                });
                const output = {"Meta":parsedMeta,"Episodes":parsedItems};
                if(output.Meta.title && output.Episodes[0])
                {
                    return fulfilled( output );
                }
                return rejected( new Error("Division by zero") );
                
            });

            // while (item = stream.read()) {
            //     console.log(2)
            //     parsedItems.push(item);
            // }

        });
    })
}

module.exports = ParseFeed;