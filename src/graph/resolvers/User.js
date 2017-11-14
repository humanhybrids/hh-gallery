export default {
  id(user) {
    return user.id_str;
  },
  screenName(user) {
    return user.screen_name;
  },
  timeline({ screen_name }, { from, count }, context) {
    return context.twitter.get({
      uri: 'statuses/user_timeline',
      screen_name,
      max_id: from,
      count,
    });
  },
  followers({ screen_name }, { cursor, count }, context) {
    return context.twitter.get({
      uri: 'followers/list',
      screen_name,
      cursor,
      count,
    });
  },
  following({ screen_name }, { cursor, count }, context) {
    return context.twitter.get({
      uri: 'friends/list',
      screen_name,
      cursor,
      count,
    });
  },
};
