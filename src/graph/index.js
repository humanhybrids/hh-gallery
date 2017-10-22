const { graphqlExpress } = require('apollo-server-express');
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const graphTools = require('graphql-tools');
const path = require('path');

const resolvers = require('./resolvers/index');
const Twitter = require('./providers/Twitter');

const typeDefs = fs.readFileSync(path.resolve(__dirname, './schema.graphql')).toString();
const graph = express.Router();
const schema = graphTools.makeExecutableSchema({ typeDefs, resolvers });

graph.use(bodyParser.json());
graph.use(graphqlExpress(({ user: { token, tokenSecret } = {} }) => ({
  schema,
  context: {
    twitter: new Twitter({ token, tokenSecret }),
  },
})));

module.exports = graph;
