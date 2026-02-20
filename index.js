require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { connectDB } = require('./config/db');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  const app = express();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  app.listen(PORT, () => {
    console.log(`Server at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
