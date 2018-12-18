const db = require('../db');

const Mutations = {
    async createPodcastStation(parent, args, ctx, info) {
        // 1. verify if user is Logged In
        // if(!ctx.request.userId){
        //   throw new Error("You must be logged to do that!");
        // }

        // 2. verify if user has "PODCASTADD" permission
        // TODO

        // 3. add podcast
        const podcastStation = await db.mutation.createPodcastStation(
          {
            data: {
                // 4. create a relationship between the PodcastStation and the User
                // user: {
                //     connect: {
                //         id: ctx.request.userId,
                //     },
                // },
              ...args,
            },
          },
          info
        );
        return podcastStation;
      },
};

module.exports = Mutations;
