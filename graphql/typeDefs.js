const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  input SignupInput {
    username: String!
    email: String!
    password: String!
  }

  type Query {
    login(usernameOrEmail: String!, password: String!): AuthPayload!
  }

  type Mutation {
    signup(input: SignupInput!): AuthPayload!
  }
`;

module.exports = typeDefs;
