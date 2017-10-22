module.exports = {
  nextCursor(group) {
    return group.next_cursor_str;
  },
  previousCursor(group) {
    return group.prev_cursor_str;
  },
};
