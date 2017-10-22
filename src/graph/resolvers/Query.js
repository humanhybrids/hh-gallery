module.exports = {
  user(_, { name }, context) {
    return context.twitter.getUser(name);
  },
};
