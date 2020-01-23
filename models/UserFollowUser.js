const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('UserFollowUser', {
  followerId: ObjectId,
  followingId: ObjectId,
});
