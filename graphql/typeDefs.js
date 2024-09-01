const { gql } = require("apollo-server");

module.exports = gql`
  type Bookmark {
    id: ID!
    image: String!
    url: String!
    title: String!
    description: String!
    createdAt: String!
    username: String!
  }
  type User {
    id: ID!
    email: String!
    token: String!
    username: String!
    createdAt: String!
  }
  input RegisterInput {
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
  }
  type Query {
    getBookmarks: [Bookmark]
    getBookmark(bookmarkId: ID!): Bookmark
    searchBookmarks(query: String!): [Bookmark]
  }
  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
    createBookmark(url: String!): Bookmark!
    deleteBookmark(bookmarkId: ID!): String!
  }
`;
