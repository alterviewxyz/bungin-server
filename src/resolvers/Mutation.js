const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const feedparser = require('../functions/ParseFeed');
const Slugify = require('../functions/Slugify');

const Mutations = {
  async signup(parent, args, ctx, info) {
    // 1. lowercase their email
    args.email = args.email.toLowerCase();
    // 2. hash their password
    const password = await bcrypt.hash(args.password, 10);
    // 3. create the user in the database
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] },
        },
      },
      info
    );
    // 4. create the JWT token for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 5. We set the jwt as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    // 6. Finally we return the user to the browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // 1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. Check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password!');
    }
    // 3. generate the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    // 5. Return the user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },
  
  async addPodcastFromURL(parent, args, ctx, info) {
      // 1. verify if user is Logged In
      if(!ctx.request.userId){
        throw new Error("You must be logged to do that!");
      }

      // 2. verify if user has "PODCASTADD" permission
      // TODO

      // 3. parse podcast feed
      let theFeed = null;
      await feedparser(args.rss)
        .then(function(feed) {
          theFeed = feed;
        })
        .catch(function(e) {
          theFeed = null;
          console.error('There was a problem with the request');
      })

      if (theFeed){
        const theSlug = Slugify(theFeed.title);
        console.log(theSlug);

        // 4. add podcast
        const podcastStation = await db.mutation.createPodcastStation(
          {
            data: {
                // 4. create a relationship between the PodcastStation and the User
                author: {
                    connect: {
                        id: ctx.request.userId,
                    },
                },
                rss: args.rss,
                pending: true,
                title: theFeed.title,
                slug: theSlug,
                description: theFeed.description.long,
                language:theFeed.language || "fa",
                episodesId:[],
                image: theFeed.image,
                website:theFeed.link,
                unProcessedFeed:theFeed
            },
          },
          info
        );
        console.log(podcastStation);
        return podcastStation;
      }
  },
  updatePodcastStation(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    // remove the ID from the updates
    delete updates.id;
    // run the update method
    return ctx.db.mutation.updatePodcastStation(
      {
        data: updates.data,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async deletePodcastStation(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. find the item
    // const item = await ctx.db.query.podcastStation({ where }, `{ id title user { id }}`);

    // 2. Check if they own that item, or have the permissions
    // const ownsItem = item.user.id === ctx.request.userId;
    // const hasPermissions = ctx.request.user.permissions.some(permission =>
    //   ['ADMIN', 'ITEMDELETE'].includes(permission)
    // );
    // if (!ownsItem && !hasPermissions) {
    //   throw new Error("You don't have permission to do that!");
    // }

    // 3. Delete it!
    return ctx.db.mutation.deletePodcastStation({ where }, info);
  },

  async createPodcastEpisode(parent, args, ctx, info) {
    // if(!ctx.request.userId){
    //   throw new Error("You must be logged to do that!");
    // }
    console.log(args);

    const item = await ctx.db.mutation.createPodcastEpisode(
      {
        data: {
          // This is how we create a relationship between the PodcastEpisode and the podcastStation
          podcastStation: {
            connect: {
              id: args.podcastStation,
            },
          },
          ...args.data,
        },
      },
      info
    );

    console.log(item);

    return item;
  },
  updatePodcastEpisode(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    // remove the ID from the updates
    delete updates.id;
    // run the update method
    return ctx.db.mutation.updatePodcastEpisode(
      {
        data: updates.data,
        where: {
          id: args.id,
        },
      },
      info
    );
  },
  async deletePodcastEpisode(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. find the item
    // const item = await ctx.db.query.item({ where }, `{ id title user { id }}`);
    // 2. Check if they own that item, or have the permissions
    // const ownsItem = item.user.id === ctx.request.userId;
    // const hasPermissions = ctx.request.user.permissions.some(permission =>
    //   ['ADMIN', 'ITEMDELETE'].includes(permission)
    // );

    // if (!ownsItem && !hasPermissions) {
    //   throw new Error("You don't have permission to do that!");
    // }
    // 3. Delete it!
    return ctx.db.mutation.deletePodcastEpisode({ where }, info);
  },

};

module.exports = Mutations;
