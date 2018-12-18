const { forwardTo } = require('prisma-binding');

const Query = {
    podcastStations: forwardTo('db'),
    podcastStation: forwardTo('db'),
};

module.exports = Query;
