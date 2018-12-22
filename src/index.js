require('dotenv').config({ path: 'variables.env' });
const jwt = require('jsonwebtoken');
const createServer = require('./createServer');
const db = require('./db');
const cookieParser = require('cookie-parser');

const server = createServer();

server.express.use(cookieParser());

// 1. decode JWT so we can get the user Id on each request
server.express.use((req, res, next) => {
  
  const { token } = req.cookies;
  
  if (token) {
    const { userId } = jwt.verify(token, process.env.APP_SECRET);
    // put the userId into the req for future requests to access
    req.userId = userId;
  }
  
  next();
});

// TODO Use express middlware to populate current user

server.start(
  {
    cors: {
      credentials: true,
      origin: process.env.FRONTEND_URL,
    },
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
  }
);
