import { graphqlExpress, graphiqlExpress } from 'apollo-server-express';
import bodyParser from 'body-parser';
import fs from 'fs';
import {
  makeExecutableSchema,
  makeRemoteExecutableSchema,
  introspectSchema,
  mergeSchemas,
} from 'graphql-tools';
import { createApolloFetch } from 'apollo-fetch';
import path from 'path';
import request from 'request-promise';

import resolvers from './resolvers/index';
import Twitter from './providers/Twitter';

const typeDefs = fs
  .readFileSync(path.resolve(__dirname, './schema.graphql'))
  .toString();

const TwitterSchema = makeExecutableSchema({ typeDefs, resolvers });

let apiKey;
let expireTime = Date.now();
async function getToken() {
  if (expireTime > Date.now()) {
    return apiKey;
  }
  const { expires_in: expires, access_token: token } = await request({
    method: 'POST',
    uri: 'https://api.yelp.com/oauth2/token',
    form: {
      grant_type: 'client_credentials',
      client_id: process.env.YELP_CLIENT_ID,
      client_secret: process.env.YELP_CLIENT_SECRET,
    },
    json: true,
  });
  expireTime = Date.now() + expires;
  apiKey = token;
  return token;
}

const fetcher = createApolloFetch({
  uri: 'https://api.yelp.com/v3/graphql',
});

fetcher.use(async ({ request, options }, next) => {
  const token = await getToken();
  if (!options.headers) {
    options.headers = {};
  }
  options.headers.Authorization = `Bearer ${token}`;
  next();
});

/**
 * @param {String} endpointURL  
 * @param {*} expressApp 
 */
export default async function initializeGraphQL(endpointURL, expressApp) {
  const schema = await introspectSchema(fetcher);
  const YelpSchema = makeRemoteExecutableSchema({ schema, fetcher });

  expressApp.use(`${endpointURL}/docs`, graphiqlExpress({ endpointURL }));

  expressApp.use(
    endpointURL,
    bodyParser.json(),
    graphqlExpress(({ user: { token, tokenSecret } = {} }) => ({
      schema: mergeSchemas({
        schemas: [TwitterSchema, YelpSchema],
      }),
      context: {
        twitter: new Twitter({ token, tokenSecret }),
      },
    })),
  );
}
