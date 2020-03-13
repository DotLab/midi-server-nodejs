const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = mongoose.model('UserLikeTrack', {
  userId: ObjectId,
  trackId: ObjectId,
});
