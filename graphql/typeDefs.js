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

  type Employee {
    id: ID!
    first_name: String!
    last_name: String!
    email: String!
    gender: String
    designation: String!
    salary: Float!
    date_of_joining: String!
    department: String!
    employee_photo: String
    createdAt: String!
    updatedAt: String!
  }

  input AddEmployeeInput {
    first_name: String!
    last_name: String!
    email: String!
    gender: String
    designation: String!
    salary: Float!
    date_of_joining: String!
    department: String!
    employee_photo: String
  }

  input UpdateEmployeeInput {
    first_name: String
    last_name: String
    email: String
    gender: String
    designation: String
    salary: Float
    date_of_joining: String
    department: String
    employee_photo: String
  }

  type Query {
    login(usernameOrEmail: String!, password: String!): AuthPayload!
    getAllEmployees: [Employee!]!
    getEmployeeByEid(eid: ID!): Employee
    getEmployeesByDesignationOrDepartment(designation: String, department: String): [Employee!]!
  }

  type Mutation {
    signup(input: SignupInput!): AuthPayload!
    addEmployee(input: AddEmployeeInput!): Employee!
    updateEmployeeByEid(eid: ID!, input: UpdateEmployeeInput!): Employee!
    deleteEmployeeByEid(eid: ID!): Employee
  }
`;

module.exports = typeDefs;
