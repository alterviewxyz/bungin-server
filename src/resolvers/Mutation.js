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
      let theFeed;
      await feedparser(args.rss)
        .then(function(feed) {
          theFeed = feed;
        })
        .catch(function(e) {
          theFeed = null;
          console.error('There was a problem with the request');
      })

      if (true){
        const theSlug = Slugify(theFeed.Meta.title);
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
                title: theFeed.Meta.title,
                slug: theSlug,
                description: theFeed.Meta.description,
                language:theFeed.Meta.language || "fa",
                episodesId:[],
                image: theFeed.Meta.image.url,
                website:theFeed.Meta.website,
                unProcessedFeed:theFeed
            },
          },
          info
        );
        console.log(podcastStation);
        return podcastStation;
      }
  },
};

module.exports = Mutations;
