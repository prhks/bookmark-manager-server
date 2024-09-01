const bookmarksResolvers = require("./bookmarks");
const usersResolvers = require("./users");

module.exports = {
  Query: {
    ...bookmarksResolvers.Query,
  },
  Mutation: {
    ...usersResolvers.Mutation,
    ...bookmarksResolvers.Mutation,
  },
};
