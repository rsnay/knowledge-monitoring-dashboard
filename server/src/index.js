// GraphQL
const { GraphQLServer } = require('graphql-yoga');
const { Prisma } = require('prisma-binding');
const Query = require('./resolvers/Query');
const Mutation = require('./resolvers/Mutation');
const QuizGradePayload = require('./resolvers/QuizGradePayload');

// App server (for static and LTI processing)
const express = require('express');

const bodyParser = require('body-parser');

// LTI function to handle launches
const { handleLaunch } = require('./lti');

// App Config check
let configLoader = {};
try {
  configLoader = require('../config');
} catch (ex) {
  throw Error('Make sure server/config.js is in place and contains the correct constants');
}
// Make the config immutable
const config = configLoader;

// Directory to serve static files from
const appDir = '../client/build';

// GraphQL queries and mutations
const resolvers = {
  Query,
  Mutation,
  QuizGradePayload
};

// Set up prisma DB
const db = new Prisma({
	typeDefs: 'src/generated/prisma.graphql',
	endpoint: config.PRISMA_ENDPOINT,
	secret: config.PRISMA_SECRET,
	debug: true,
});

// Set up our graphql server
const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  resolverValidationOptions :{
    requireResolversForResolveType: false
  },
  context: req => ({
    ...req,
    // Allow this server's mutations and queries to access prisma server
    db
  }),
});

// Handle LTI launch requests
// create application/x-www-form-urlencoded parser
const urlencodedParser = bodyParser.urlencoded({ extended: false })
server.post('/lti/:action/:parameter1', urlencodedParser, (req, res) => handleLaunch(config, db, req, res));

// Serve static files last, to catch everything else
server.use(express.static(appDir));

server.start({
  port: config.APP_SERVER_PORT || 4000,
}, () => console.log(`Server is running on port ${config.APP_SERVER_PORT || 4000}`));
